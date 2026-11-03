import { z } from 'zod';

import {
  GENERATION_ASPECTS,
  GENERATION_CATALOG,
  MAX_GENERATION_BODY_BYTES,
  MAX_GENERATION_IMAGE_BYTES,
} from '@/config/generation';

export class GenerationInputError extends Error {}

const schema = z
  .object({
    requestId: z.uuid(),
    mediaType: z.enum(['image', 'video']),
    prompt: z.string().trim().min(3).max(2000),
    image: z.string().max(MAX_GENERATION_BODY_BYTES).optional(),
    aspectRatio: z.enum(GENERATION_ASPECTS),
  })
  .strict();

export type GenerationInput = z.infer<typeof schema>;

/** Validate a raster signature rather than trusting the MIME string alone. */
export function validateGenerationImage(value: string) {
  const match =
    /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(
      value
    );
  if (!match || match[2].length % 4 !== 0) {
    throw new GenerationInputError('Upload a PNG, JPEG or WebP photo.');
  }
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > MAX_GENERATION_IMAGE_BYTES || bytes.length < 12) {
    throw new GenerationInputError(
      'Photo must be a valid image no larger than 5 MB.'
    );
  }
  const png = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const webp =
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!(
    (match[1] === 'image/png' && png) ||
    (match[1] === 'image/jpeg' && jpeg) ||
    (match[1] === 'image/webp' && webp)
  )) {
    throw new GenerationInputError(
      'Photo contents do not match its image type.'
    );
  }
}

export function parseGenerationInput(value: unknown): GenerationInput {
  const parsed = schema.safeParse(value);
  if (!parsed.success)
    throw new GenerationInputError(
      'Choose a valid format and enter a prompt of 3 to 2,000 characters.'
    );
  if (parsed.data.mediaType === 'video' && !parsed.data.image)
    throw new GenerationInputError('Upload a photo to create a video.');
  if (parsed.data.image) validateGenerationImage(parsed.data.image);
  return parsed.data;
}

/** Bound streamed bodies too; content-length alone is not a reliable limit. */
export async function readGenerationInput(request: Request) {
  if (
    !request.headers
      .get('content-type')
      ?.toLowerCase()
      .startsWith('application/json')
  ) {
    throw new GenerationInputError('Send a JSON generation request.');
  }
  if (
    Number(request.headers.get('content-length') || 0) >
    MAX_GENERATION_BODY_BYTES
  ) {
    throw new GenerationInputError('Photo must be no larger than 5 MB.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new GenerationInputError('Generation request is empty.');
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_GENERATION_BODY_BYTES) {
        await reader.cancel();
        throw new GenerationInputError('Photo must be no larger than 5 MB.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  let value: unknown;
  try {
    value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new GenerationInputError('Generation request is not valid JSON.');
  }
  return parseGenerationInput(value);
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generationIdentity(
  userId: string,
  input: GenerationInput
) {
  const id = 'gen_' + (await sha256(`${userId}:${input.requestId}`));
  const fingerprint = await sha256(
    JSON.stringify({
      mediaType: input.mediaType,
      prompt: input.prompt,
      image: input.image || '',
      aspectRatio: input.aspectRatio,
    })
  );
  return { id, fingerprint };
}

export function generationProviderInput(input: GenerationInput) {
  if (input.mediaType === 'video')
    return {
      model: GENERATION_CATALOG.video.model,
      credits: GENERATION_CATALOG.video.credits,
      options: {
        image_url: input.image,
        duration: GENERATION_CATALOG.video.duration,
        enable_safety_checker: true,
      },
    };
  if (input.image)
    return {
      model: GENERATION_CATALOG.image.editModel,
      credits: GENERATION_CATALOG.image.credits,
      options: {
        image_url: input.image,
        aspect_ratio: input.aspectRatio,
        num_images: 1,
        output_format: 'jpeg',
        safety_tolerance: '2',
      },
    };
  const sizes = {
    '1:1': 'square_hd',
    '3:4': 'portrait_4_3',
    '9:16': 'portrait_16_9',
    '16:9': 'landscape_16_9',
  } as const;
  return {
    model: GENERATION_CATALOG.image.textModel,
    credits: GENERATION_CATALOG.image.credits,
    options: {
      image_size: sizes[input.aspectRatio],
      num_images: 1,
      output_format: 'jpeg',
      enable_safety_checker: true,
    },
  };
}
