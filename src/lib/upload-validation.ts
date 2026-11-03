/** Check bytes before publishing uploads; a MIME label is caller-controlled. */
export function isRasterImage(bytes: Uint8Array, mime: string): boolean {
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.subarray(start, end));
  if (bytes.length < 12) return false;
  switch (mime) {
    case 'image/jpeg':
    case 'image/jpg':
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case 'image/png':
      return [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b);
    case 'image/webp':
      return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
    case 'image/gif':
      return ['GIF87a', 'GIF89a'].includes(ascii(0, 6));
    case 'image/avif':
      return ascii(4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(8, 12));
    case 'image/heic':
    case 'image/heif':
      return (
        ascii(4, 8) === 'ftyp' &&
        ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(ascii(8, 12))
      );
    default:
      return false;
  }
}

export class UploadValidationError extends Error {}

/** Limit the actual stream before formData() buffers it, including chunked uploads. */
export async function readUploadForm(request: Request, limit: number) {
  const type = request.headers.get('content-type') || '';
  if (!/^multipart\/form-data\s*;/i.test(type))
    throw new UploadValidationError('Send a multipart image upload');
  if (Number(request.headers.get('content-length') || 0) > limit)
    throw new UploadValidationError('Upload is larger than 20MB in total');
  const reader = request.body?.getReader();
  if (!reader) throw new UploadValidationError('No files provided');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new UploadValidationError('Upload is larger than 20MB in total');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return await new Response(body, {
      headers: { 'content-type': type },
    }).formData();
  } catch {
    throw new UploadValidationError('Invalid multipart image upload');
  }
}
