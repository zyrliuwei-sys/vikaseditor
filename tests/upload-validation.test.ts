import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isRasterImage, readUploadForm } from '../src/lib/upload-validation';

test('fake image MIME labels cannot publish SVG or HTML uploads', () => {
  for (const content of [
    '<svg onload="alert(1)"></svg>',
    '<html><script>alert(1)</script>',
  ]) {
    for (const mime of [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
      'image/heic',
    ]) {
      assert.equal(
        isRasterImage(new TextEncoder().encode(content), mime),
        false
      );
    }
  }
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB', 'base64');
  assert.equal(isRasterImage(png, 'image/png'), true);
  assert.equal(isRasterImage(png, 'image/jpeg'), false);
});

test('chunked multipart bodies are limited before parsing, without content-length', async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    pull(controller) {
      controller.enqueue(new Uint8Array(100));
    },
    cancel() {
      cancelled = true;
    },
  });
  const request = new Request('http://localhost/upload', {
    method: 'POST',
    headers: { 'content-type': 'multipart/form-data; boundary=test' },
    body: stream,
    duplex: 'half',
  } as RequestInit);
  await assert.rejects(readUploadForm(request, 200), /larger/);
  assert.equal(cancelled, true);
});

test('valid bounded multipart data retains files and rejects malformed input', async () => {
  const data = new FormData();
  data.append(
    'files',
    new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }),
    'photo.png'
  );
  const parsed = await readUploadForm(
    new Request('http://localhost/upload', { method: 'POST', body: data }),
    1000
  );
  assert.equal((parsed.get('files') as File).name, 'photo.png');
  await assert.rejects(
    readUploadForm(
      new Request('http://localhost/upload', {
        method: 'POST',
        body: 'bad',
        headers: { 'content-type': 'multipart/form-data; boundary=test' },
      }),
      1000
    ),
    /Invalid/
  );
});
