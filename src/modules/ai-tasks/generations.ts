import { and, desc, eq, inArray, isNull } from 'drizzle-orm';

import { db } from '@/core/db';
import { atomic, AtomicGuardError, guard } from '@/core/db/atomic';
import { envConfigs } from '@/config';
import { aiTask, config, user } from '@/config/db/schema';
import {
  imageTrialAvailable,
  planConsume,
  planImageTrial,
  planRevoke,
} from '@/modules/credits/service';

const SCENE = 'vikas_studio';
const ACTIVE = ['pending', 'processing'];
export const TRIAL_BUDGET_KEY = 'vikas_image_trial_budget';

export async function imageTrialBudget(now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const [row] = await db()
    .select()
    .from(config)
    .where(eq(config.name, TRIAL_BUDGET_KEY))
    .limit(1);
  const initial = JSON.stringify({ day, used: 0 });
  const previous: string = row?.value ?? initial;
  let state;
  try {
    state = JSON.parse(previous);
  } catch {
    state = null;
  }
  const rawLimit = Number(envConfigs.image_trial_daily_limit);
  const limit =
    Number.isInteger(rawLimit) && rawLimit >= 0 && rawLimit <= 10000
      ? rawLimit
      : 0;
  const valid =
    state &&
    typeof state.day === 'string' &&
    Number.isSafeInteger(state.used) &&
    state.used >= 0;
  const used = valid && state.day !== day ? 0 : state?.used;
  return {
    day,
    previous,
    initial,
    used,
    available: Boolean(valid && used < limit),
  };
}

export async function imageTrialAccess(userId: string, credits: number) {
  const [[account], unused, budget] = await Promise.all([
    db()
      .select({ verified: user.emailVerified })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1),
    imageTrialAvailable(userId, credits),
    imageTrialBudget(),
  ]);
  return {
    freeImageAvailable: Boolean(
      unused && account?.verified && budget.available
    ),
    trialRequiresVerification: Boolean(unused && !account?.verified),
    trialPaused: Boolean(unused && account?.verified && !budget.available),
  };
}
export type GenerationTask = typeof aiTask.$inferSelect;

export class GenerationTaskError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

function parsed(value: string | null): Record<string, unknown> {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

export async function findGeneration(
  id: string,
  userId: string
): Promise<GenerationTask | undefined> {
  const [task] = await db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.id, id),
        eq(aiTask.userId, userId),
        eq(aiTask.scene, SCENE),
        isNull(aiTask.deletedAt)
      )
    )
    .limit(1);
  return task;
}

export async function listGenerations(
  userId: string
): Promise<GenerationTask[]> {
  return db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.userId, userId),
        eq(aiTask.scene, SCENE),
        isNull(aiTask.deletedAt)
      )
    )
    .orderBy(desc(aiTask.createdAt))
    .limit(50);
}

function matchingTask(task: GenerationTask, fingerprint: string) {
  if (parsed(task.options).fingerprint !== fingerprint) {
    throw new GenerationTaskError(
      'This request was already used for a different generation. Start a new generation.',
      409
    );
  }
  return { task, created: false };
}

/** A unique task primary key claims submission and the debit in one D1 batch. */
export async function createGeneration(params: {
  id: string;
  userId: string;
  fingerprint: string;
  mediaType: 'image' | 'video';
  model: string;
  prompt: string;
  aspectRatio: string;
  credits: number;
  usePaidCredits?: boolean;
}): Promise<{ task: GenerationTask; created: boolean }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const existing = await findGeneration(params.id, params.userId);
    if (existing) return matchingTask(existing, params.fingerprint);
    const unusedTrial =
      params.mediaType === 'image' &&
      (await imageTrialAvailable(params.userId, params.credits));
    const [account] = unusedTrial
      ? await db()
          .select({ verified: user.emailVerified })
          .from(user)
          .where(eq(user.id, params.userId))
          .limit(1)
      : [];
    const eligibleTrial = Boolean(unusedTrial && account?.verified);
    const currentBudget = eligibleTrial ? await imageTrialBudget() : null;
    if (currentBudget && !currentBudget.available && !params.usePaidCredits)
      throw new GenerationTaskError(
        'Free images have reached today’s limit. Please try again tomorrow.',
        429
      );
    // A depleted trial must never silently become a paid request. The client
    // opts in only after showing the paid cost; prices still come from catalog.
    const budget = currentBudget?.available ? currentBudget : null;
    const freeImage = Boolean(budget);
    // Another tab may have consumed this account's trial since its quote.
    // An explicit free quote must never fall through to a paid debit, even
    // after an atomic guard retries the request with the latest balance.
    if (!freeImage && params.usePaidCredits !== true)
      throw new GenerationTaskError(
        params.usePaidCredits === false
          ? 'Free image availability changed. Review the updated price before generating.'
          : 'Refresh this page and review the current price before using purchased credits.',
        409
      );
    const plan = freeImage
      ? planImageTrial(params.userId, params.credits, params.id)
      : await planConsume({
          userId: params.userId,
          credits: params.credits,
          scene: SCENE,
          description: `AI ${params.mediaType} generation`,
          metadata: JSON.stringify({ taskId: params.id }),
          paidOnly: true,
        });
    if (!plan) {
      // A concurrent duplicate may have spent the last credits while we read.
      const concurrent = await findGeneration(params.id, params.userId);
      if (concurrent) return matchingTask(concurrent, params.fingerprint);
      if (unusedTrial && !account?.verified)
        throw new GenerationTaskError(
          'Verify your email before using the free image.',
          403
        );
      throw new GenerationTaskError(
        'Not enough credits. Add credits before generating.',
        402
      );
    }
    const row: typeof aiTask.$inferInsert = {
      id: params.id,
      userId: params.userId,
      mediaType: params.mediaType,
      provider: 'evolink',
      model: params.model,
      prompt: params.prompt,
      options: JSON.stringify({
        fingerprint: params.fingerprint,
        aspectRatio: params.aspectRatio,
        funding: freeImage ? 'image_trial' : 'paid',
      }),
      status: 'pending',
      scene: SCENE,
      costCredits: params.credits,
      creditId: plan.consumedCredit.id,
      taskInfo: JSON.stringify({ creditId: plan.consumedCredit.id }),
    };
    try {
      await atomic((q) => [
        ...(budget
          ? [
              guard({
                table: user,
                column: 'id',
                where: eq(user.id, params.userId),
                require: eq(user.emailVerified, true),
                message: 'Email verification changed',
              }),
              q
                .insert(config)
                .values({ name: TRIAL_BUDGET_KEY, value: budget.initial })
                .onConflictDoNothing(),
              guard({
                table: config,
                column: 'name',
                where: eq(config.name, TRIAL_BUDGET_KEY),
                require: eq(config.value, budget.previous),
                message: 'Trial budget changed',
              }),
              q
                .update(config)
                .set({
                  value: JSON.stringify({
                    day: budget.day,
                    used: budget.used + 1,
                  }),
                })
                .where(eq(config.name, TRIAL_BUDGET_KEY)),
            ]
          : []),
        q.insert(aiTask).values(row),
        ...plan.steps(q),
      ]);
      const task = await findGeneration(params.id, params.userId);
      if (!task) throw new Error('Created generation missing');
      return { task, created: true };
    } catch (error) {
      const concurrent = await findGeneration(params.id, params.userId);
      if (concurrent) return matchingTask(concurrent, params.fingerprint);
      if (error instanceof AtomicGuardError) continue;
      throw error;
    }
  }
  throw new GenerationTaskError(
    'Credits changed while generating. Please try again.',
    402
  );
}

export async function acceptGeneration(
  task: GenerationTask,
  providerId: string
) {
  await db()
    .update(aiTask)
    .set({
      status: 'processing',
      taskId: providerId,
      taskInfo: JSON.stringify({
        ...parsed(task.taskInfo),
        creditId: task.creditId,
      }),
      taskResult: null,
    })
    .where(
      and(
        eq(aiTask.id, task.id),
        eq(aiTask.userId, task.userId),
        eq(aiTask.status, 'pending')
      )
    );
  return (await findGeneration(task.id, task.userId))!;
}

/** Never automatically resubmit a request with an unknown provider outcome. */
export async function markGenerationUncertain(task: GenerationTask) {
  await db()
    .update(aiTask)
    .set({
      status: 'processing',
      taskResult: JSON.stringify({
        error:
          'Submission status is uncertain. Please contact support before trying again.',
      }),
    })
    .where(
      and(
        eq(aiTask.id, task.id),
        eq(aiTask.userId, task.userId),
        eq(aiTask.status, 'pending'),
        isNull(aiTask.taskId)
      )
    );
  return (await findGeneration(task.id, task.userId))!;
}

export async function finishGeneration(
  task: GenerationTask,
  result:
    { status: 'success'; url: string } | { status: 'failed'; error: string }
) {
  const latest = await findGeneration(task.id, task.userId);
  if (!latest || !ACTIVE.includes(latest.status)) return latest || task;
  const revoke =
    result.status === 'failed' && latest.creditId
      ? await planRevoke(latest.creditId)
      : null;
  try {
    await atomic((q) => [
      guard({
        table: aiTask,
        column: 'userId',
        where: and(eq(aiTask.id, latest.id), eq(aiTask.userId, latest.userId)),
        require: inArray(aiTask.status, ACTIVE),
        message: 'Generation already settled',
      }),
      q
        .update(aiTask)
        .set({
          status: result.status,
          taskResult: JSON.stringify(
            result.status === 'success'
              ? { url: result.url }
              : { error: result.error }
          ),
        })
        .where(eq(aiTask.id, latest.id)),
      ...(revoke ? revoke.steps(q) : []),
    ]);
  } catch (error) {
    if (!(error instanceof AtomicGuardError)) throw error;
  }
  return (await findGeneration(latest.id, latest.userId))!;
}

export function generationResponse(task: GenerationTask) {
  const result = parsed(task.taskResult);
  const staleSubmission =
    !task.taskId &&
    ACTIVE.includes(task.status) &&
    Date.now() - new Date(task.createdAt).getTime() > 120_000;
  return {
    id: task.id,
    status: task.status,
    mediaType: task.mediaType,
    prompt: task.prompt,
    ...(typeof result.url === 'string' && task.status === 'success'
      ? { url: result.url }
      : {}),
    ...(typeof result.error === 'string'
      ? { error: result.error }
      : staleSubmission
        ? {
            error:
              'Submission status is uncertain. Please contact support before trying again.',
          }
        : {}),
    createdAt: new Date(task.createdAt).toISOString(),
  };
}
