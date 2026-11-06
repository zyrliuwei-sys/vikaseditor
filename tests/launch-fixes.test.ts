import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MAX_AVATAR_BYTES, validAvatarDataUrl } from '../src/lib/avatar';
import { isEmailSendingConfigured } from '../src/lib/email-config';
import {
  DRAFT_TTL_MS,
  parseStudioDraft,
  restoreStudioDraft,
} from '../src/lib/studio-draft';

const photo =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1cAAAAASUVORK5CYII=';
test('draft restoration rejects expired, invalid and overlong stored input', () => {
  const now = Date.now();
  const draft = {
    scope: '/create/image',
    ownerId: null,
    mode: 'image',
    templateId: 'golden-hour',
    prompt: 'Original draft',
    aspectRatio: '3:4',
    expiresAt: now + DRAFT_TTL_MS,
  };
  assert.equal(
    parseStudioDraft(JSON.stringify(draft), now)?.prompt,
    draft.prompt
  );
  for (const patch of [
    { expiresAt: now },
    { mode: 'unsupported' },
    { prompt: 'x'.repeat(2001) },
    { photoKey: '../another-draft' },
    { scope: 'https://outside.test' },
  ]) {
    assert.equal(
      parseStudioDraft(JSON.stringify({ ...draft, ...patch }), now),
      null
    );
  }
  assert.equal(parseStudioDraft('{bad'), null);
});
test('inline avatars reject active content, spoofed MIME and oversized bytes', () => {
  assert.equal(validAvatarDataUrl(photo), true);
  assert.equal(
    validAvatarDataUrl(photo.replace('image/png', 'image/jpeg')),
    false
  );
  assert.equal(
    validAvatarDataUrl(
      'data:image/svg+xml;base64,' + Buffer.from('<svg/>').toString('base64')
    ),
    false
  );
  assert.equal(
    validAvatarDataUrl(
      'data:image/png;base64,' +
        Buffer.alloc(MAX_AVATAR_BYTES + 1).toString('base64')
    ),
    false
  );
  assert.equal(validAvatarDataUrl('data:image/png;base64,***='), false);
});
test('draft text survives blocked photo storage and another account cannot restore it', async () => {
  const oldSession = Object.getOwnPropertyDescriptor(
    globalThis,
    'sessionStorage'
  );
  const oldIndexedDb = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
  let stored: string | null = JSON.stringify({
    scope: '/create/image',
    ownerId: 'owner',
    mode: 'image',
    templateId: '',
    prompt: 'Keep my original text',
    aspectRatio: '3:4',
    expiresAt: Date.now() + DRAFT_TTL_MS,
    photoKey: crypto.randomUUID(),
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: () => stored,
      removeItem: () => {
        stored = null;
      },
    },
  });
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    value: {
      open: () => {
        throw new Error('Photo storage disabled');
      },
    },
  });
  try {
    const draft = await restoreStudioDraft('/create/image', 'owner');
    assert.equal(draft?.prompt, 'Keep my original text');
    assert.equal(draft?.photoMissing, true);
    assert.equal(
      await restoreStudioDraft('/create/image', 'another-account'),
      null
    );
    assert.equal(stored, null);
  } finally {
    if (oldSession)
      Object.defineProperty(globalThis, 'sessionStorage', oldSession);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
    if (oldIndexedDb)
      Object.defineProperty(globalThis, 'indexedDB', oldIndexedDb);
    else Reflect.deleteProperty(globalThis, 'indexedDB');
  }
});
test('email capability follows the selected provider and requires all credentials', () => {
  assert.equal(isEmailSendingConfigured({}), false);
  assert.equal(
    isEmailSendingConfigured({ resend_api_key: 'test-only' }),
    false
  );
  const resend = {
    resend_api_key: 'test-only',
    resend_sender_email: 'sender@example.test',
  };
  assert.equal(isEmailSendingConfigured(resend), true);
  assert.equal(
    isEmailSendingConfigured({ ...resend, email_provider: 'cloudflare' }),
    false
  );
});
