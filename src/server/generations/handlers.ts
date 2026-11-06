import {
  EvoLinkProvider,
  EvoLinkRequestError,
  validEvoLinkConfig,
} from '@/core/ai/evolink';
import { FalProvider, FalRequestError } from '@/core/ai/fal';
import { AIMediaType, AITaskStatus } from '@/core/ai/types';
import { getAuth } from '@/core/auth';
import { GENERATION_CATALOG } from '@/config/generation';
import {
  acceptGeneration,
  createGeneration,
  findGeneration,
  finishGeneration,
  generationResponse,
  GenerationTaskError,
  imageTrialAccess,
  listGenerations,
  markGenerationUncertain,
} from '@/modules/ai-tasks/generations';
import { getAllConfigs } from '@/modules/config/service';
import { getPaidBalance } from '@/modules/credits/service';
import { isEmailSendingConfigured } from '@/lib/email-config';
import { safeGenerationDownloadUrl } from '@/lib/generation-download';
import {
  generationIdentity,
  GenerationInputError,
  generationProviderInput,
  readGenerationInput,
} from '@/lib/generation-input';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

const PRIVATE = { headers: { 'cache-control': 'no-store' } };
const fail = (message: string, status: number) =>
  respErr(message, { ...PRIVATE, status });

async function authenticate(
  request: Request,
  intervalMs: number,
  scope: string
) {
  const limited = enforceMinIntervalRateLimit(request, {
    intervalMs,
    keyPrefix: `generation-${scope}-ip`,
  });
  if (limited) return limited;
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session?.user)
    return fail('Sign in to generate and view your creations.', 401);
  const userLimited = enforceMinIntervalRateLimit(request, {
    intervalMs,
    keyPrefix: `generation-${scope}-user`,
    extraKey: session.user.id,
  });
  return userLimited || session.user.id;
}

function safeError(error: unknown) {
  if (error instanceof GenerationInputError) return fail(error.message, 400);
  if (error instanceof GenerationTaskError)
    return fail(error.message, error.status);
  return fail(
    'The generation service is temporarily unavailable. Please try again later.',
    503
  );
}

export async function generationConfig() {
  try {
    const config = await getAllConfigs();
    return respData(
      {
        configured: validEvoLinkConfig(config),
        imageCredits: GENERATION_CATALOG.image.credits,
        videoCredits: GENERATION_CATALOG.video.credits,
      },
      PRIVATE
    );
  } catch {
    return fail('Generation settings are temporarily unavailable.', 503);
  }
}

export async function generationAccess({ request }: { request: Request }) {
  try {
    const userId = await authenticate(request, 200, 'access');
    if (userId instanceof Response) return userId;
    const [paidCredits, trial, config] = await Promise.all([
      getPaidBalance(userId),
      imageTrialAccess(userId, GENERATION_CATALOG.image.credits),
      getAllConfigs(),
    ]);
    return respData(
      {
        paidCredits,
        ...trial,
        emailVerificationAvailable: isEmailSendingConfigured(config),
      },
      PRIVATE
    );
  } catch (error) {
    return safeError(error);
  }
}

export async function generationList({ request }: { request: Request }) {
  try {
    const userId = await authenticate(request, 300, 'history');
    if (userId instanceof Response) return userId;
    return respData(
      (await listGenerations(userId)).map(generationResponse),
      PRIVATE
    );
  } catch (error) {
    return safeError(error);
  }
}

export async function generationCreate({ request }: { request: Request }) {
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin)
      return fail('Cross-origin generation requests are not allowed.', 403);
    const userId = await authenticate(request, 2000, 'create');
    if (userId instanceof Response) return userId;
    const input = await readGenerationInput(request);
    const config = await getAllConfigs();
    if (!validEvoLinkConfig(config))
      return fail(
        'AI generation is not enabled yet. You can still explore templates and copy prompts.',
        503
      );
    const identity = await generationIdentity(userId, input);
    const providerInput = generationProviderInput(input);
    const { task, created } = await createGeneration({
      ...identity,
      userId,
      mediaType: input.mediaType,
      model: providerInput.model,
      prompt: input.prompt,
      aspectRatio: input.aspectRatio,
      credits: providerInput.credits,
      usePaidCredits: input.usePaidCredits,
    });
    if (!created) return respData(generationResponse(task), PRIVATE);
    const provider = new EvoLinkProvider({
      apiKey: config.evolink_api_key,
      timeoutMs: 30_000,
    });
    try {
      const result = await provider.generate({
        params: {
          mediaType:
            input.mediaType === 'video' ? AIMediaType.VIDEO : AIMediaType.IMAGE,
          model: providerInput.model,
          prompt: input.prompt,
          options: providerInput.options,
        },
      });
      if (!/^[a-zA-Z0-9_-]{1,128}$/.test(result.taskId))
        throw new Error('Invalid provider job reference');
      const accepted = await acceptGeneration(task, result.taskId);
      return respData(generationResponse(accepted), PRIVATE);
    } catch (error) {
      // A concrete queue rejection means no job was accepted. Network errors,
      // timeouts and 5xx responses may have accepted a paid job: do not resubmit.
      if (
        error instanceof EvoLinkRequestError &&
        (error.phase === 'upload' ||
          [400, 401, 402, 403, 404, 413, 422, 429].includes(error.status))
      ) {
        const failed = await finishGeneration(task, {
          status: 'failed',
          error:
            'The provider could not accept this generation. Your credits were restored.',
        });
        return respData(generationResponse(failed), PRIVATE);
      }
      const uncertain = await markGenerationUncertain(task);
      return respData(generationResponse(uncertain), PRIVATE);
    }
  } catch (error) {
    return safeError(error);
  }
}

export async function generationGet({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  try {
    const userId = await authenticate(request, 1000, 'poll');
    if (userId instanceof Response) return userId;
    if (!/^gen_[a-f0-9]{64}$/.test(params.id))
      return fail('Generation not found.', 404);
    const task = await findGeneration(params.id, userId);
    if (!task) return fail('Generation not found.', 404);
    if (!['pending', 'processing'].includes(task.status) || !task.taskId)
      return respData(generationResponse(task), PRIVATE);
    const config = await getAllConfigs();
    if (
      task.provider === 'evolink'
        ? !validEvoLinkConfig(config)
        : !config.fal_api_key?.trim()
    )
      return fail('AI generation is not enabled yet.', 503);
    const provider =
      task.provider === 'evolink'
        ? new EvoLinkProvider({
            apiKey: config.evolink_api_key,
            timeoutMs: 15_000,
          })
        : new FalProvider({
            apiKey: config.fal_api_key,
            timeoutMs: 15_000,
          });
    try {
      const result = await provider.query({
        taskId: task.taskId,
        model: task.model,
        mediaType:
          task.mediaType === 'video' ? AIMediaType.VIDEO : AIMediaType.IMAGE,
      });
      if (result.taskStatus === AITaskStatus.SUCCESS) {
        const url =
          task.mediaType === 'video'
            ? result.taskInfo?.videos?.[0]?.videoUrl
            : result.taskInfo?.images?.[0]?.imageUrl;
        let validUrl = false;
        try {
          const parsed = new URL(url || '');
          validUrl =
            parsed.protocol === 'https:' &&
            !parsed.username &&
            !parsed.password;
        } catch {
          /* invalid result */
        }
        const completed = validUrl
          ? await finishGeneration(task, { status: 'success', url: url! })
          : await finishGeneration(task, {
              status: 'failed',
              error:
                'No usable result was returned. Your credits were restored.',
            });
        return respData(generationResponse(completed), PRIVATE);
      }
      if (
        result.taskStatus === AITaskStatus.FAILED ||
        result.taskStatus === AITaskStatus.CANCELED
      ) {
        const failed = await finishGeneration(task, {
          status: 'failed',
          error:
            'This generation could not be completed. Your credits were restored.',
        });
        return respData(generationResponse(failed), PRIVATE);
      }
      return respData(generationResponse(task), PRIVATE);
    } catch (error) {
      // A completed Fal request with validation/safety failure returns 422.
      if (error instanceof FalRequestError && error.status === 422) {
        const failed = await finishGeneration(task, {
          status: 'failed',
          error:
            'This generation could not be completed. Your credits were restored.',
        });
        return respData(generationResponse(failed), PRIVATE);
      }
      // Transient polling failures never change task state or restore credits.
      return fail(
        'Still checking your generation. Please try again shortly.',
        503
      );
    }
  } catch (error) {
    return safeError(error);
  }
}

export async function generationDownload({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  try {
    const userId = await authenticate(request, 300, 'download');
    if (userId instanceof Response) return userId;
    const task = await findGeneration(params.id, userId);
    const result = task && generationResponse(task);
    const url =
      result?.status === 'success' && result.url
        ? safeGenerationDownloadUrl(result.url)
        : null;
    if (!url) return fail('Download not found.', 404);
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(30_000),
    });
    const mime =
      response.headers.get('content-type')?.split(';')[0].trim() || '';
    const extension = (
      {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
      } as Record<string, string>
    )[mime];
    const maxBytes = 128 * 1024 * 1024;
    if (
      !response.ok ||
      !response.body ||
      !extension ||
      Number(response.headers.get('content-length')) > maxBytes
    ) {
      await response.body?.cancel();
      return fail(
        'This download is no longer available. Results are temporary; download them within 24 hours.',
        410
      );
    }
    let received = 0;
    const bounded = response.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          received += chunk.byteLength;
          if (received > maxBytes) throw new Error('Download too large');
          controller.enqueue(chunk);
        },
      })
    );
    return new Response(bounded, {
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `attachment; filename="vikas-${task!.mediaType}-${task!.id.slice(-12)}.${extension}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return fail('Unable to download this result. Please try again.', 503);
  }
}
