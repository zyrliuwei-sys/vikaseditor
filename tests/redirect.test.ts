import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveAfterAuthUrl, safeInternalPath } from '../src/lib/redirect';

test('post-auth redirects reject scheme-relative, backslash and control-character escapes', () => {
  for (const input of [
    '//evil.test/',
    '/\\evil.test/',
    '\\\\evil.test/',
    '\n//evil.test/',
    'javascript:alert(1)',
    'https://evil.test/',
  ]) {
    assert.equal(safeInternalPath(input), null, input);
    assert.equal(resolveAfterAuthUrl({ callbackUrl: input }), '/settings');
  }
});

test('internal routes survive normalization while localized auth loops are rejected', () => {
  assert.equal(
    safeInternalPath('/settings?tab=profile'),
    '/settings?tab=profile'
  );
  assert.equal(safeInternalPath('/create?mode=video'), '/create?mode=video');
  for (const input of [
    '/sign-in',
    '/zh/sign-in',
    '/foo/../sign-in',
    '/sign-up?redirect=/',
  ]) {
    assert.equal(safeInternalPath(input), null, input);
  }
});
