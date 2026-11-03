import assert from 'node:assert/strict';
import { test } from 'node:test';

import { GENERATION_CATALOG } from '../src/config/generation';
import { getPricingProduct } from '../src/config/pricing';
import {
  EvoLinkProvider,
  EvoLinkRequestError,
  validEvoLinkConfig,
} from '../src/core/ai/evolink';
import { AIMediaType, AITaskStatus } from '../src/core/ai/types';
import { safeGenerationDownloadUrl } from '../src/lib/generation-download';
import {
  studioPaymentProvider,
  studioProducts,
} from '../src/server/payment/storefront';

const photo =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1cAAAAASUVORK5CYII=';
test('EvoLink uploads a reference before generation and maps unified task output', async () => {
  const original = globalThis.fetch;
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (calls.length === 1)
      return Response.json({
        success: true,
        data: { file_url: 'https://files.evolink.ai/reference.png' },
      });
    if (calls.length === 2)
      return Response.json({ id: 'task-test', status: 'pending' });
    return Response.json({
      id: 'task-test',
      status: 'completed',
      results: ['https://files.evolink.ai/output.mp4'],
    });
  };
  try {
    const provider = new EvoLinkProvider({ apiKey: 'test-placeholder' });
    const task = await provider.generate({
      params: {
        mediaType: AIMediaType.VIDEO,
        model: GENERATION_CATALOG.video.model,
        prompt: 'Gentle camera movement',
        options: {
          image_url: photo,
          duration: 5,
          quality: '720p',
          content_filter: true,
        },
      },
    });
    assert.equal(task.taskId, 'task-test');
    assert.equal(
      calls[0].url,
      'https://files-api.evolink.ai/api/v1/files/upload/stream'
    );
    assert.ok(calls[0].init?.body instanceof FormData);
    const payload = JSON.parse(String(calls[1].init?.body));
    assert.deepEqual(payload.image_urls, [
      'https://files.evolink.ai/reference.png',
    ]);
    assert.equal(payload.image_url, undefined);
    assert.equal(payload.content_filter, true);
    assert.equal(
      calls.every((c) => c.init?.redirect === 'manual'),
      true
    );
    const result = await provider.query({
      taskId: task.taskId,
      mediaType: 'video',
    });
    assert.equal(result.taskStatus, AITaskStatus.SUCCESS);
    assert.equal(
      result.taskInfo?.videos?.[0]?.videoUrl,
      'https://files.evolink.ai/output.mp4'
    );
  } finally {
    globalThis.fetch = original;
  }
});

test('upload failures are distinct from ambiguous submission failures and errors never echo secrets', async () => {
  const original = globalThis.fetch;
  try {
    const provider = new EvoLinkProvider({ apiKey: 'test-placeholder' });
    globalThis.fetch = async () => {
      throw new Error('credential-private-body');
    };
    for (const image of [photo, undefined]) {
      await assert.rejects(
        provider.generate({
          params: {
            mediaType: AIMediaType.IMAGE,
            prompt: 'Test portrait',
            options: { image_url: image },
          },
        }),
        (error: unknown) =>
          error instanceof EvoLinkRequestError &&
          error.phase === (image ? 'upload' : 'submit') &&
          !error.message.includes('credential-private-body')
      );
    }
    globalThis.fetch = async () =>
      Response.json({ id: 'different-task', status: 'completed', results: [] });
    await assert.rejects(
      provider.query({ taskId: 'our-task' }),
      EvoLinkRequestError
    );
    globalThis.fetch = async () =>
      Response.json({
        id: 'our-task',
        status: 'failed',
        error: { message: 'private response' },
      });
    const failed = await provider.query({ taskId: 'our-task' });
    assert.equal(failed.taskStatus, AITaskStatus.FAILED);
    assert.equal(JSON.stringify(failed).includes('private response'), false);
  } finally {
    globalThis.fetch = original;
  }
});

test('API credentials and result downloads cannot be redirected to arbitrary hosts', () => {
  for (const base of [
    'http://api.evolink.ai',
    'https://api.evolink.ai.evil.test',
    'https://attacker@api.evolink.ai',
    'https://api.evolink.ai:8080',
    'https://api.evolink.ai/evil',
  ])
    assert.equal(
      validEvoLinkConfig({
        evolink_api_key: 'test-placeholder',
        evolink_base_url: base,
      }),
      false
    );
  assert.equal(
    validEvoLinkConfig({
      evolink_api_key: 'test-placeholder',
      evolink_base_url: 'https://api.evolink.ai/v1/',
    }),
    true
  );
  for (const url of [
    'http://127.0.0.1/private',
    'https://files.evolink.ai.evil.test/a',
    'https://files.evolink.ai@evil.test/a',
    'file:///etc/passwd',
  ])
    assert.equal(safeGenerationDownloadUrl(url), null);
  assert.ok(safeGenerationDownloadUrl('https://files.evolink.ai/output.png'));
});

test('six real packages preserve the 8x base rate without demo discounts', () => {
  const products = studioProducts();
  assert.equal(products.length, 6);
  assert.equal(products.filter((p) => p.type === 'subscription').length, 3);
  for (const product of products) {
    assert.equal(product.priceInCents, product.credits);
    assert.equal(product.currency, 'usd');
    if (product.type === 'subscription')
      assert.equal(product.plan?.interval, 'month');
    else assert.equal(product.creditsValidDays, 0);
  }
  assert.equal(GENERATION_CATALOG.image.credits, Math.ceil((63 * 8) / 10));
  assert.equal(GENERATION_CATALOG.video.credits, Math.ceil((199 * 5 * 8) / 10));
  assert.equal(getPricingProduct('starter_monthly'), null);
  assert.equal(getPricingProduct('toString'), null);
  assert.equal(
    studioPaymentProvider({
      paypal_enabled: 'true',
      paypal_client_id: 'test-placeholder',
      paypal_client_secret: 'test-placeholder',
    }),
    null
  );
  assert.equal(
    studioPaymentProvider({
      paypal_enabled: 'true',
      paypal_client_id: 'test-placeholder',
      paypal_client_secret: 'test-placeholder',
      paypal_webhook_id: 'test-placeholder',
    }),
    'paypal'
  );
});
