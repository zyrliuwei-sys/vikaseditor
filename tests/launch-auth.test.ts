import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { eq } from 'drizzle-orm';

const directory = await mkdtemp(join(tmpdir(), 'vikas-launch-auth-'));
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_PROVIDER: 'sqlite',
  DATABASE_URL: `file:${directory}/test.db`,
  AUTH_SECRET: 'local-auth-regression-only-not-a-real-credential',
  VITE_APP_URL: 'http://localhost:3000',
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
const { getAuth } = await import('../src/core/auth');
const { db } = await import('../src/core/db');
const { user } = await import('../src/config/db/schema');
const { getAllConfigs, saveConfigs } =
  await import('../src/modules/config/service');
const { ResendProvider } = await import('../src/core/email/resend');
const { generationAccess } = await import('../src/server/generations/handlers');
const { createGeneration } =
  await import('../src/modules/ai-tasks/generations');
const { GENERATION_CATALOG } = await import('../src/config/generation');
const { Route: authRoute } = await import('../src/routes/api/auth/$');
const { Route: profileRoute } = await import('../src/routes/api/user/profile');
const authPost = (authRoute.options.server!.handlers as any).POST;
const patch = (profileRoute.options.server!.handlers as any).PATCH;
const actualSend = ResendProvider.prototype.sendEmail;
let emailFailure = false;
const sent: any[] = [];
ResendProvider.prototype.sendEmail = async function (message) {
  sent.push(message);
  return emailFailure
    ? { success: false, error: 'simulated delivery outage', provider: 'resend' }
    : { success: true, messageId: 'test-message', provider: 'resend' };
};
after(async () => {
  ResendProvider.prototype.sendEmail = actualSend;
  await rm(directory, { recursive: true, force: true });
});
const auth = getAuth(await getAllConfigs());
const signup = await auth.api.signUpEmail({
  body: {
    name: '<b>Local test</b>',
    email: 'creator@example.test',
    password: 'Local-test-only-123!',
  },
  asResponse: true,
});
assert.equal(signup.status, 200);
const cookie = signup.headers
  .getSetCookie()
  .map((s: string) => s.split(';')[0])
  .join('; ');
const created = await signup.json();
const uid = created.user.id;
const photo =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1cAAAAASUVORK5CYII=';
const request = (body: unknown, extra: Record<string, string> = {}) =>
  new Request('http://localhost:3000/api/user/profile', {
    method: 'PATCH',
    headers: {
      origin: 'http://localhost:3000',
      'content-type': 'application/json',
      cookie,
      ...extra,
    },
    body: JSON.stringify(body),
  });

test('email signup without a mail provider starts a session and can claim a free image', async () => {
  assert.equal(created.user.emailVerified, false);
  const session = await auth.api.getSession({
    headers: new Headers({ cookie }),
  });
  assert.equal(session?.user.id, uid);
  const response = await generationAccess({
    request: new Request('http://localhost:3000/api/generations/access', {
      headers: { cookie },
    }),
  });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data, {
    paidCredits: 0,
    freeImageAvailable: true,
    trialPaused: false,
  });
  const { task } = await createGeneration({
    id: 'new-signup-free-image',
    userId: uid,
    fingerprint: 'new-signup-free-image',
    mediaType: 'image',
    model: GENERATION_CATALOG.image.textModel,
    prompt: 'A cinematic portrait',
    aspectRatio: '3:4',
    credits: GENERATION_CATALOG.image.credits,
    usePaidCredits: false,
  });
  assert.equal(JSON.parse(task.options!).funding, 'image_trial');
  const [saved] = await db().select().from(user).where(eq(user.id, uid));
  assert.equal(saved.emailVerified, false);
  assert.equal(
    sent.length,
    0,
    'signup and free access do not send verification mail'
  );
});

test('profile avatars save without storage and remain scoped to the authenticated user', async () => {
  const result = await patch({
    request: request({ image: photo, userId: 'some-other-user' }),
  });
  assert.equal((await result.json()).code, 0);
  const [saved] = await db().select().from(user).where(eq(user.id, uid));
  assert.equal(saved.image, photo);
  const crossOrigin = await patch({
    request: request({ name: 'Changed' }, { origin: 'https://outside.test' }),
  });
  assert.equal(crossOrigin.status, 403);
  globalThis.__minIntervalRateLimitStore?.clear();
  const oversized = await patch({
    request: request({ image: 'x'.repeat(50_000) }),
  });
  assert.equal(oversized.status, 413);
  globalThis.__minIntervalRateLimitStore?.clear();
  const activeImage = await patch({
    request: request({ image: 'data:image/svg+xml;base64,PHN2Zy8+' }),
  });
  assert.equal(activeImage.status, 400);
});

test('missing email provider refuses reset requests consistently for known and unknown users', async () => {
  for (const email of ['creator@example.test', 'unknown@example.test']) {
    const result = await authPost({
      request: new Request(
        'http://localhost:3000/api/auth/request-password-reset',
        {
          method: 'POST',
          headers: {
            origin: 'http://localhost:3000',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      ),
    });
    assert.equal(result.status, 503);
    assert.equal((await result.json()).code, 'EMAIL_UNAVAILABLE');
  }
  assert.equal(sent.length, 0);
});

test('optional verification works for existing accounts and delivery failures reject', async () => {
  await saveConfigs({
    resend_api_key: 'test-provider-key',
    resend_sender_email: 'Vikas <sender@example.test>',
    email_verification_enabled: 'false',
  });
  const configured = getAuth(await getAllConfigs());
  emailFailure = true;
  await assert.rejects(
    () =>
      configured.api.sendVerificationEmail({
        body: { email: 'creator@example.test', callbackURL: '/create/image' },
      }),
    /Email delivery/
  );
  emailFailure = false;
  const result = await configured.api.sendVerificationEmail({
    body: { email: 'creator@example.test', callbackURL: '/create/image' },
    asResponse: true,
  });
  assert.equal(result.status, 200);
  assert.equal(
    sent.length,
    2,
    'failed delivery must not start the resend cooldown'
  );
  emailFailure = true;
  const reset = await configured.api.requestPasswordReset({
    body: { email: 'creator@example.test', redirectTo: '/reset-password' },
  });
  assert.equal(
    reset.status,
    true,
    'password reset keeps the same generic response to prevent account enumeration'
  );
  assert.equal(sent.length, 3);
  assert.ok(sent[2].html.includes('&lt;b&gt;Local test&lt;/b&gt;'));
  assert.ok(!sent[2].html.includes('<b>Local test</b>'));
});
