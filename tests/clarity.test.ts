import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isClarityPage } from '../src/lib/clarity';
import { safeEmbedSetting } from '../src/lib/embed-ids';

test('Clarity is limited to the public creation funnel', () => {
  for (const path of [
    '/',
    '/pricing',
    '/create',
    '/create/image/',
    '/create/video',
    '/template/cinematic-push',
  ]) {
    assert.equal(isClarityPage(path), true, path);
  }
  for (const path of [
    '/sign-in',
    '/sign-up',
    '/settings/studio',
    '/admin',
    '/api/payment/callback',
    '/create/internal',
    '/blog',
    '/pricing-comparison',
  ]) {
    assert.equal(isClarityPage(path), false, path);
  }
});

test('Clarity accepts a public project ID and discards scripts or URLs', () => {
  assert.equal(
    safeEmbedSetting('clarity_project_id', '  zk5a4qus0k  '),
    'zk5a4qus0k'
  );
  for (const value of [
    'https://example.test/tag/test',
    'abcde/path',
    'abcde<script>',
    'abc"def',
    '',
  ]) {
    assert.equal(safeEmbedSetting('clarity_project_id', value), '');
  }
});
