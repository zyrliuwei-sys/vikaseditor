import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { eq } from 'drizzle-orm';

const directory = await mkdtemp(join(tmpdir(), 'vikas-generations-test-'));
Object.assign(process.env, {
  DATABASE_PROVIDER: 'sqlite',
  DATABASE_URL: `file:${directory}/test.db`,
  AUTH_SECRET: 'generation-test-only-not-a-credential',
  NODE_ENV: 'test',
});
execFileSync(
  process.execPath,
  [
    'node_modules/drizzle-kit/bin.cjs',
    'push',
    '--dialect=sqlite',
    '--schema=./src/config/db/schema.sqlite.ts',
    `--url=${process.env.DATABASE_URL}`,
    '--force',
  ],
  { stdio: 'pipe', env: process.env }
);
const { db } = await import('../src/core/db');
const { atomic, setAtomicModeForTests } = await import('../src/core/db/atomic');
const schema = await import('../src/config/db/schema');
const {
  createGeneration,
  acceptGeneration,
  findGeneration,
  finishGeneration,
  listGenerations,
  markGenerationUncertain,
  generationResponse,
} = await import('../src/modules/ai-tasks/generations');
const { planRevoke } = await import('../src/modules/credits/service');
const {
  parseGenerationInput,
  readGenerationInput,
  generationIdentity,
  generationProviderInput,
} = await import('../src/lib/generation-input');
const { FalProvider, FalRequestError } = await import('../src/core/ai/fal');
const { AIMediaType, AITaskStatus } = await import('../src/core/ai/types');
const { MAX_GENERATION_BODY_BYTES } = await import('../src/config/generation');

const photo =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1cAAAAASUVORK5CYII=';
const base = {
  requestId: crypto.randomUUID(),
  mediaType: 'image' as const,
  prompt: 'Create a cinematic portrait',
  aspectRatio: '3:4' as const,
};
let count = 0;
async function account(credits = 20) {
  const id = `generation-user-${count++}`;
  await db()
    .insert(schema.user)
    .values({ id, email: `${id}@example.test`, name: 'Test creator' });
  await db()
    .insert(schema.credit)
    .values({
      id: `grant-${id}`,
      userId: id,
      transactionNo: `grant-${id}`,
      transactionType: 'grant',
      transactionScene: 'gift',
      credits,
      remainingCredits: credits,
      status: 'active',
    });
  return id;
}
async function balance(userId: string) {
  const rows = await db()
    .select()
    .from(schema.credit)
    .where(eq(schema.credit.userId, userId));
  return rows
    .filter((r: any) => r.transactionType === 'grant')
    .reduce((sum: number, row: any) => sum + row.remainingCredits, 0);
}
async function taskParams(userId: string, requestId = crypto.randomUUID()) {
  const input = parseGenerationInput({ ...base, requestId });
  const identity = await generationIdentity(userId, input);
  const provider = generationProviderInput(input);
  return {
    ...identity,
    userId,
    mediaType: input.mediaType,
    model: provider.model,
    prompt: input.prompt,
    aspectRatio: input.aspectRatio,
    credits: provider.credits,
  };
}

before(() => setAtomicModeForTests('batch'));
after(async () => {
  setAtomicModeForTests(undefined);
  await rm(directory, { recursive: true, force: true });
});

test('only bounded raster data URLs and known request fields are accepted', async () => {
  assert.equal(parseGenerationInput({ ...base, image: photo }).image, photo);
  for (const image of [
    'https://example.test/selfie.jpg',
    'http://127.0.0.1/internal',
    'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    'data:image/jpeg;base64,' + Buffer.alloc(100).toString('base64'),
  ]) {
    assert.throws(() => parseGenerationInput({ ...base, image }));
  }
  assert.throws(() => parseGenerationInput({ ...base, costCredits: 0 }));
  assert.throws(() =>
    parseGenerationInput({ ...base, model: 'arbitrary/provider' })
  );
  assert.throws(() => parseGenerationInput({ ...base, mediaType: 'video' }));
  assert.throws(() =>
    parseGenerationInput({ ...base, prompt: 'a'.repeat(2001) })
  );
  assert.throws(() => parseGenerationInput({ ...base, aspectRatio: '100:1' }));
  const video = generationProviderInput(
    parseGenerationInput({ ...base, image: photo, mediaType: 'video' })
  );
  assert.equal(video.credits, 20);
  assert.equal(video.options.duration, '5');
  assert.equal('aspect_ratio' in video.options, false);
});

test('request streaming limit applies even without content-length', async () => {
  const request = new Request('http://localhost/api/generations', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: ' '.repeat(MAX_GENERATION_BODY_BYTES + 1),
  });
  await assert.rejects(readGenerationInput(request), /5 MB/);
});

test('a duplicate request claims one provider submission and one debit under concurrency', async () => {
  const user = await account(4);
  const params = await taskParams(user);
  let submissions = 0;
  const results = await Promise.all(
    Array.from({ length: 12 }, async () => {
      const result = await createGeneration(params);
      if (result.created) submissions++;
      return result;
    })
  );
  assert.equal(submissions, 1);
  assert.equal(new Set(results.map((r) => r.task.id)).size, 1);
  assert.equal(await balance(user), 0);
  const debits = await db()
    .select()
    .from(schema.credit)
    .where(eq(schema.credit.userId, user));
  assert.equal(
    debits.filter((r: any) => r.transactionType === 'consume').length,
    1
  );
  assert.equal((await listGenerations(user)).length, 1);
});

test('separate concurrent requests cannot overdraw the same last credits', async () => {
  const user = await account(4);
  const a = await taskParams(user),
    b = await taskParams(user);
  const results = await Promise.allSettled([
    createGeneration(a),
    createGeneration(b),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(await balance(user), 0);
  assert.equal((await listGenerations(user)).length, 1);
});

test('the idempotency key is scoped to owner and rejects a different payload', async () => {
  const user = await account(),
    other = await account();
  const params = await taskParams(user);
  const { task } = await createGeneration(params);
  assert.equal(await findGeneration(task.id, other), undefined);
  assert.equal((await listGenerations(other)).length, 0);
  await assert.rejects(
    createGeneration({ ...params, fingerprint: 'changed' }),
    /different generation/
  );
  const one = await generationIdentity(user, base),
    two = await generationIdentity(other, base);
  assert.notEqual(one.id, two.id);
  assert.equal(await balance(user), 16);
});

test('provider id persists separately and never loses the consumption reference', async () => {
  const user = await account();
  const { task } = await createGeneration(await taskParams(user));
  const accepted = await acceptGeneration(task, 'provider-job-id');
  assert.equal(accepted.taskId, 'provider-job-id');
  assert.equal(accepted.creditId, task.creditId);
  assert.equal(JSON.parse(accepted.taskInfo!).creditId, task.creditId);
  assert.equal(accepted.status, 'processing');
  assert.equal(accepted.options?.includes('data:image'), false);
});

test('concurrent failure settlement restores credits exactly once and terminal state cannot regress', async () => {
  const user = await account();
  const { task } = await createGeneration(await taskParams(user));
  await Promise.all(
    Array.from({ length: 8 }, () =>
      finishGeneration(task, { status: 'failed', error: 'Provider failed' })
    )
  );
  assert.equal(await balance(user), 20);
  assert.equal((await findGeneration(task.id, user))!.status, 'failed');
  await finishGeneration(task, {
    status: 'success',
    url: 'https://fal.media/result.jpg',
  });
  await acceptGeneration(task, 'late-acceptance');
  assert.equal((await findGeneration(task.id, user))!.status, 'failed');
});

test('racing success and failure settle together with the correct final balance', async () => {
  const user = await account();
  const { task } = await createGeneration(await taskParams(user));
  await Promise.all([
    finishGeneration(task, {
      status: 'success',
      url: 'https://fal.media/result.jpg',
    }),
    finishGeneration(task, { status: 'failed', error: 'Failure' }),
  ]);
  const saved = (await findGeneration(task.id, user))!;
  assert.equal(await balance(user), saved.status === 'success' ? 16 : 20);
});

test('a failure later in a refund batch rolls back the task and restored grant', async () => {
  const user = await account();
  const { task } = await createGeneration(await taskParams(user));
  const refund = await planRevoke(task.creditId!);
  assert.ok(refund);
  await assert.rejects(
    atomic((q) => [
      q
        .update(schema.aiTask)
        .set({ status: 'failed' })
        .where(eq(schema.aiTask.id, task.id)),
      ...refund.steps(q),
      q.insert(schema.aiTask).values({ ...task }),
    ])
  );
  assert.equal(await balance(user), 16);
  assert.equal((await findGeneration(task.id, user))!.status, 'pending');
});

test('ambiguous submissions keep their unique claim and do not pretend to fail or refund', async () => {
  const user = await account();
  const params = await taskParams(user);
  const { task } = await createGeneration(params);
  const uncertain = await markGenerationUncertain(task);
  assert.equal(uncertain.status, 'processing');
  assert.match(generationResponse(uncertain).error!, /uncertain/);
  assert.equal((await createGeneration(params)).created, false);
  assert.equal(await balance(user), 16);
});

test('Fal errors expose only status and preserve transient polling failures', async () => {
  const savedFetch = globalThis.fetch;
  const provider = new FalProvider({
    apiKey: 'test-placeholder',
    timeoutMs: 1000,
  });
  try {
    globalThis.fetch = async () =>
      new Response('secret provider detail', { status: 422 });
    await assert.rejects(
      provider.generate({
        params: {
          model: 'fal-ai/flux/dev',
          prompt: base.prompt,
          mediaType: AIMediaType.IMAGE,
        },
      }),
      (error: unknown) =>
        error instanceof FalRequestError &&
        error.status === 422 &&
        !error.message.includes('secret')
    );
    let calls = 0;
    globalThis.fetch = async () =>
      ++calls === 1
        ? Response.json({ status: 'COMPLETED' })
        : Response.json({
            images: [{ url: 'https://fal.media/image.jpg' }],
            has_nsfw_concepts: [true],
          });
    assert.equal(
      (
        await provider.query({
          taskId: 'id',
          model: 'fal-ai/flux/dev',
          mediaType: AIMediaType.IMAGE,
        })
      ).taskStatus,
      AITaskStatus.FAILED
    );
    globalThis.fetch = async () => new Response('', { status: 503 });
    await assert.rejects(
      provider.query({
        taskId: 'id',
        model: 'fal-ai/flux/dev',
        mediaType: AIMediaType.IMAGE,
      }),
      FalRequestError
    );
  } finally {
    globalThis.fetch = savedFetch;
  }
});
