# Generation backend

The first version uses the existing encrypted `fal_api_key` setting under Admin → Settings → AI → Fal. No environment key fallback or database schema change is required. Accounts need credits before generation; signup grants and payments retain their existing configuration.

## Endpoints

- `GET /api/generations/config`: public capability flag and server credit costs only.
- `POST /api/generations`: signed-in, same-origin JSON request; returns an owned task.
- `GET /api/generations`: latest 50 studio tasks for the signed-in user.
- `GET /api/generations/:id`: owned task status, with provider polling while active.

POST input: `requestId` (UUID), `mediaType` (`image` or `video`), `prompt` (3–2,000 characters), optional `image` (JPEG/PNG/WebP base64 data URL up to 5 MB), and `aspectRatio` (`1:1`, `3:4`, `9:16`, `16:9`). Video requires an image. Unknown fields, arbitrary image URLs, MIME/signature mismatch and oversize streamed bodies are rejected. Images are sent to Fal only on generation and are not stored in the application's database.

## Server catalog

| Mode                    | Model                                                 | Credits |
| ----------------------- | ----------------------------------------------------- | ------: |
| Text to image           | fal-ai/flux/dev                                       |       4 |
| Photo edit              | fal-ai/flux-pro/kontext                               |       4 |
| Photo to 5-second video | fal-ai/kling-video/v2.5-turbo/standard/image-to-video |      20 |

Kling inherits the uploaded photo's framing; its selected endpoint does not accept an aspect-ratio option. The frontend should make this explicit. Image options request one JPEG with the provider's safety settings enabled. Prices above are product credits, not claims about provider currency pricing.

Primary schemas checked on 2026-11-03:

- https://fal.ai/models/fal-ai/flux/dev/api
- https://fal.ai/models/fal-ai/flux-pro/kontext/api
- https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/standard/image-to-video/api

## Integrity and recovery

A SHA-256 owner/request ID forms the unique task primary key. Task insertion and credit consumption share one atomic batch. A second submission with that key returns the original task; a different payload with the same key is rejected. Only the winning insertion sends a provider request. `creditId` and provider `taskId` are retained separately. A terminal failure and restoration of consumed credits commit together; guarded terminal transitions prevent late success/failure responses from changing settled results.

A definite provider queue rejection refunds the task. Transport errors, submission timeouts, 5xx responses and a process crash after submission can leave the provider's acceptance uncertain. Such a task retains its unique claim and credits, shows a clear support message, and is never resubmitted automatically. An operator must reconcile it against Fal before compensating the user. This first version has no provider webhook/reconciliation worker. Transient status-polling errors preserve the existing task and charge. Provider credentials and raw error bodies are never returned.

Successful result URLs are HTTPS provider-hosted assets. They are shown only by authenticated owner API responses, but anyone with the underlying provider URL may access that URL. These assets have provider-controlled retention; the first version does not archive them to R2. The original photo bytes are neither retained in `ai_task` nor included in logs.

## Verification

- `node --import tsx --test tests/generations.test.ts`: 11 passed. Concurrent idempotency and last-credit contention, owner isolation, conflicting payloads, refund races, atomic rollback, uncertain submission retention, input bounds and provider sanitization.
- `pnpm test:atomic`: 11 passed after extracting composable `planRevoke`; verifies existing revoke idempotency and D1-compatible batch behavior against isolated SQLite.
- `pnpm exec tsc --noEmit --pretty false`: passed when the backend was completed.
- No paid live provider request was made. A funded Fal key and an account with credits are required for a live image/video smoke test.

`UPGRADING.md` should describe the new API, the credit catalog, the new additive `planRevoke` export and the operational limitations above. No migration is needed.
