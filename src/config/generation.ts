/** Server-owned generation catalog. Requests never choose prices or model URLs. */
export const GENERATION_CATALOG = {
  image: {
    // Published 1K base output price $0.063 × 8 × 100 credits/USD, rounded up.
    // Extra input/thinking charges are absorbed by the platform in v1.
    credits: 51,
    textModel: 'gemini-3.1-flash-image-preview',
    editModel: 'gemini-3.1-flash-image-preview',
    quality: '1K',
  },
  video: {
    // Standard 720p: $0.199/second × 5 seconds × 8 × 100 credits/USD.
    credits: 796,
    model: 'seedance-2.0-image-to-video',
    duration: 5,
    quality: '720p',
  },
} as const;

export const GENERATION_ASPECTS = ['1:1', '3:4', '9:16', '16:9'] as const;
export const MAX_GENERATION_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_GENERATION_BODY_BYTES =
  Math.ceil((MAX_GENERATION_IMAGE_BYTES * 4) / 3) + 32 * 1024;
