import assert from 'node:assert/strict';
import { test } from 'node:test';

import { decryptSecret, encryptSecret } from '../src/lib/crypto';
import { testEvoLinkConnection } from '../src/lib/evolink-settings';
import {
  assertEndpointSecretsResupplied,
  isSecretConfigKey,
  maskConfigValue,
} from '../src/modules/config/service';
import { getSettingGroups, getSettings } from '../src/modules/config/settings';
import { getTestSpec } from '../src/modules/config/settings-test-specs';

const key = 'fixture-evolink-key-not-a-real-secret';
const validResponse = {
  success: true,
  data: {
    user: { remaining_credits: 12.5 },
    token: { remaining_credits: 0, unlimited_credits: false },
  },
};

test('EvoLink credentials are registered as a private password field and testable group', () => {
  assert.ok(
    getSettingGroups().some((g) => g.name === 'evolink' && g.tab === 'ai')
  );
  assert.equal(
    getSettings().find((s) => s.name === 'evolink_api_key')?.type,
    'password'
  );
  assert.equal(isSecretConfigKey('evolink_api_key'), true);
  assert.deepEqual(getTestSpec('evolink')?.fields, []);
});

test('EvoLink uses the shared encryption and masked-secret flow', async () => {
  const previous = process.env.CONFIG_ENCRYPTION_KEY;
  process.env.CONFIG_ENCRYPTION_KEY = 'isolated-test-encryption-key';
  try {
    const ciphertext = await encryptSecret(key);
    assert.ok(ciphertext.startsWith('enc:v1:'));
    assert.ok(!ciphertext.includes(key));
    assert.equal(await decryptSecret(ciphertext), key);
    assert.ok(!maskConfigValue(key).includes(key));
    assert.throws(
      () =>
        assertEndpointSecretsResupplied(
          {
            evolink_base_url: 'https://example.invalid',
            evolink_api_key: maskConfigValue(key),
          },
          { evolink_base_url: 'https://api.evolink.ai', evolink_api_key: key }
        ),
      /re-entering evolink_api_key/
    );
    assert.doesNotThrow(() =>
      assertEndpointSecretsResupplied(
        {
          evolink_base_url: 'https://api.evolink.ai/',
          evolink_api_key: maskConfigValue(key),
        },
        { evolink_base_url: 'https://api.evolink.ai', evolink_api_key: key }
      )
    );
  } finally {
    if (previous === undefined) delete process.env.CONFIG_ENCRYPTION_KEY;
    else process.env.CONFIG_ENCRYPTION_KEY = previous;
  }
});

test('connection test is a read-only authenticated credits request, including zero balance', async (t) => {
  const requests: { url: string; init?: RequestInit }[] = [];
  t.mock.method(globalThis, 'fetch', async (url: URL, init?: RequestInit) => {
    requests.push({ url: String(url), init });
    return Response.json(validResponse);
  });
  for (const base of [
    '',
    'https://api.evolink.ai',
    'https://api.evolink.ai/v1/',
  ]) {
    const result = await testEvoLinkConnection({
      evolink_api_key: key,
      evolink_base_url: base,
    });
    assert.equal(result.success, true);
    assert.equal(result.details?.['API Key credits'], '0');
    assert.ok(!JSON.stringify(result).includes(key));
  }
  for (const request of requests) {
    assert.equal(request.url, 'https://api.evolink.ai/v1/credits');
    assert.equal(request.init?.method, 'GET');
    assert.equal(request.init?.body, undefined);
    assert.equal(request.init?.redirect, 'manual');
    assert.ok(request.init?.signal instanceof AbortSignal);
    assert.equal(
      new Headers(request.init?.headers).get('Authorization'),
      `Bearer ${key}`
    );
  }
});

test('missing or masked credentials and untrusted endpoints never make a request', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    throw new Error('unexpected request');
  });
  for (const apiKey of ['', maskConfigValue(key), 'bad\r\nkey']) {
    assert.equal(
      (await testEvoLinkConnection({ evolink_api_key: apiKey })).success,
      false
    );
  }
  for (const base of [
    'http://api.evolink.ai',
    'https://127.0.0.1',
    'https://api.evolink.ai.evil.test',
    'https://user:pass@api.evolink.ai',
    'https://api.evolink.ai:444',
    'https://api.evolink.ai?key=secret',
    'https://api.evolink.ai/#fragment',
    'https://api.evolink.ai/other',
    'invalid',
  ]) {
    assert.equal(
      (
        await testEvoLinkConnection({
          evolink_api_key: key,
          evolink_base_url: base,
        })
      ).success,
      false
    );
  }
  assert.equal(calls, 0);
});

test('provider errors and malformed responses do not leak credentials or become success', async (t) => {
  for (const status of [301, 401, 403, 429, 500]) {
    const mock = t.mock.method(
      globalThis,
      'fetch',
      async () => new Response(key, { status })
    );
    const result = await testEvoLinkConnection({ evolink_api_key: key });
    assert.equal(result.success, false);
    assert.ok(!JSON.stringify(result).includes(key));
    mock.mock.restore();
  }
  for (const body of [
    {},
    { success: false, message: key },
    { success: true, data: { user: { remaining_credits: key } } },
  ]) {
    const mock = t.mock.method(globalThis, 'fetch', async () =>
      Response.json(body)
    );
    const result = await testEvoLinkConnection({ evolink_api_key: key });
    assert.equal(result.success, false);
    assert.ok(!JSON.stringify(result).includes(key));
    mock.mock.restore();
  }
  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error(key);
  });
  const result = await testEvoLinkConnection({ evolink_api_key: key });
  assert.equal(result.success, false);
  assert.ok(!JSON.stringify(result).includes(key));
});

test('unlimited keys are handled without exposing the upstream payload', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json({
      ...validResponse,
      data: {
        user: { remaining_credits: 0 },
        token: { unlimited_credits: true, api_key: key },
      },
    })
  );
  const result = await testEvoLinkConnection({ evolink_api_key: key });
  assert.equal(result.success, true);
  assert.deepEqual(result.details, {
    'Account credits': '0',
    'API Key credits': 'Unlimited',
  });
});
