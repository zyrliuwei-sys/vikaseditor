/** Server-owned generation catalog. Requests never choose prices or model URLs. */
export const GENERATION_CATALOG = {
  image: {
    credits: 4,
    textModel: 'fal-ai/flux/dev',
    editModel: 'fal-ai/flux-pro/kontext',
  },
  video: {
    credits: 20,
    model: 'fal-ai/kling-video/v2.5-turbo/standard/image-to-video',
    duration: '5',
  },
} as const;

export const GENERATION_ASPECTS = ['1:1', '3:4', '9:16', '16:9'] as const;
export const MAX_GENERATION_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_GENERATION_BODY_BYTES =
  Math.ceil((MAX_GENERATION_IMAGE_BYTES * 4) / 3) + 32 * 1024;
