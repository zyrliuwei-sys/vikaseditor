import assert from 'node:assert/strict';
import { test } from 'node:test';

import { clearAccountCache, makeQueryClient } from '../src/lib/query-client';

test('sign-out removes private records and ignores a late response from the previous account', async () => {
  const client = makeQueryClient();
  client.setQueryData(['user-info'], { id: 'previous-account' });
  client.setQueryData(['payments'], [{ orderNo: 'private-order' }]);

  let finishRequest!: (value: string[]) => void;
  let started!: () => void;
  const requestStarted = new Promise<void>((resolve) => {
    started = resolve;
  });
  const oldRequest = client
    .fetchQuery({
      queryKey: ['credits'],
      queryFn: () => {
        started();
        return new Promise<string[]>((resolve) => {
          finishRequest = resolve;
        });
      },
    })
    .catch(() => undefined);
  await requestStarted;

  await clearAccountCache(client);
  finishRequest(['private-credit']);
  await oldRequest;
  assert.equal(client.getQueryCache().getAll().length, 0);

  const nextAccount = await client.fetchQuery({
    queryKey: ['user-info'],
    queryFn: async () => ({ id: 'next-account' }),
  });
  assert.equal(nextAccount.id, 'next-account');
  assert.equal(client.getQueryData(['payments']), undefined);
  assert.equal(client.getQueryData(['credits']), undefined);
  client.clear();
});
