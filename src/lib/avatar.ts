import { isRasterImage } from '@/lib/upload-validation';

export const MAX_AVATAR_BYTES = 32 * 1024;
export const MAX_PROFILE_BODY_BYTES = 48 * 1024;

export function validAvatarDataUrl(value: string): boolean {
  const match =
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(
      value
    );
  if (
    !match ||
    match[2].length > Math.ceil(MAX_AVATAR_BYTES / 3) * 4 ||
    match[2].length % 4
  )
    return false;
  try {
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    return bytes.length <= MAX_AVATAR_BYTES && isRasterImage(bytes, match[1]);
  } catch {
    return false;
  }
}

/** Avatars fit in the existing profile row; no object-storage credentials needed. */
export async function prepareAvatar(file: File): Promise<string> {
  if (
    !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(
      file.type
    ) ||
    file.size > 2 * 1024 * 1024
  )
    throw new Error('Invalid avatar');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    if (!img.naturalWidth || !img.naturalHeight)
      throw new Error('Invalid avatar');
    const canvas = document.createElement('canvas');
    const scale = Math.min(
      1,
      256 / Math.max(img.naturalWidth, img.naturalHeight)
    );
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image resizing unavailable');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.65, 0.45]) {
      const result = canvas.toDataURL('image/jpeg', quality);
      if (validAvatarDataUrl(result)) return result;
    }
    throw new Error('Avatar is too large');
  } finally {
    URL.revokeObjectURL(url);
  }
}
