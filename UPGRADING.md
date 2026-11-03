# Upgrading an existing project

Read this when a project built from this template pulls newer template code.
Entries are newest first. Apply **every entry dated after the template version
the project last pulled**, oldest of those first.

## 2026-11-03 — Cloudflare PayPal checkout compatibility

- PayPal OAuth and API requests now use `redirect: 'manual'` and reject non-success responses. Workers does not support `redirect: 'error'`; it threw before contacting PayPal and caused every checkout to return 502. The same incompatible option was corrected in EvoLink generation/configuration/downloads and IndexNow submission. Redirects still never forward credentials or bypass host checks.
- Checkout failures now log only their stage, error type and stack frames on the server, without customer data, keys or provider response bodies. Existing PayPal credentials and database schema need no changes; redeploy the Worker.
- `tests/paypal-workers.test.ts` runs one-time/monthly checkout and redirect-rejection cases in actual workerd, with intercepted outbound requests and no live payments. Keep this alongside the D1 settlement/concurrency tests.

## 2026-11-03 — Self-hosted Plausible host configuration

- This project's Cloudflare runtime and `deploy/cloudflare.json` now allow `stats.cadcraft.org` through `PLAUSIBLE_SCRIPT_HOSTS`. The admin Analytics form can save this self-hosted script URL, and future deployments retain the host allowlist.
- Keep the host check enabled. Other projects must explicitly configure their own trusted Plausible host; do not allow arbitrary script URLs through database settings. No schema or application-code change is required.

## 2026-11-03 — EvoLink generation and Vikas pricing v1

- The studio now uses EvoLink (`evolink_api_key` and the existing official-host setting) for Nano Banana 2 / `gemini-3.1-flash-image-preview` at 1K and Seedance 2.0 image-to-video at 720p, 5 seconds with audio. Reference images use EvoLink’s temporary upload API. Existing Fal tasks can still be polled. Download links are temporary; the authenticated download endpoint verifies ownership and allows only known provider hosts.
- One free image per account is claimed atomically with the task in the existing credit ledger. Concurrent requests cannot claim it twice. A confirmed generation failure restores the free attempt or paid credits; an ambiguous submission keeps its claim pending investigation. Free-image grants cannot fund video or other credit consumption. Studio paid generations accept credits backed by a currently paid order, so promotional/manual gifts are excluded.
- Pricing v1 replaces the demo subscription/lifetime catalog: one-time USD 9/29/79 and monthly USD 19/49/99, at 100 credits per USD. Images cost 51 credits and 5-second videos 796 credits, using 8× the published base API rates, rounded up. Extra image input/thinking charges are absorbed by the platform. One-time credits never expire; monthly credits expire at the paid billing period’s end. Old catalog IDs are no longer offered for new checkout; existing orders retain their recorded terms.
- Checkout for these six products uses PayPal Orders v2 and monthly Subscriptions. Enable PayPal in Admin → Settings → Payment and configure Client ID, Client Secret, Webhook ID and the matching Live/Sandbox environment. Subscribe the same PayPal app to checkout approval/capture completion, subscription sale completion and subscription lifecycle events at `/api/payment/notify/paypal`. Until configured, packages remain visible but purchase is explicitly unavailable. Real payment validation still requires merchant credentials.
- PayPal is now registered with the payment manager. Approval alone never grants credits: one-time orders require completed capture and subscription callbacks require a completed transaction. Webhooks match the checkout/subscription ID, validate amount and currency, and deduplicate against actual transaction IDs. Explicit requests for an unavailable provider no longer fall back to a different provider. No schema changes are needed.
- No schema migration or new environment variable is required. Existing D1 bindings and encrypted key storage are preserved. Run `node --import tsx --test tests/generations.test.ts tests/evolink-provider.test.ts` and `ATOMIC_D1=1 node --import tsx --test tests/generations.test.ts` to exercise free claims, paid-only debits and concurrent refunds on local isolated databases.

## 2026-11-03 — EvoLink admin settings

- Admin Settings → AI now includes an EvoLink card with `evolink_base_url` and a masked `evolink_api_key`, using the existing config storage. Configure `CONFIG_ENCRYPTION_KEY` to encrypt saved credentials, as for other provider secrets.
- The Test button authenticates with the official `GET https://api.evolink.ai/v1/credits` endpoint. It does not create generation jobs or deduct application credits. Only the official HTTPS API host is accepted; redirects are refused and endpoint changes require the key to be re-entered.
- No schema migration, provider environment variable, generation adapter or payment change is required. This adds credential configuration only; it does not enable EvoLink generation in the product.

## 2026-11-03 — Public SEO routes and template pages

- Image/video navigation now uses `/create/image` and `/create/video`; `/create` remains directly accessible without a default-query redirect. Robots still excludes private and authentication routes but no longer blocks all query strings.
- `/guest-post` is retained with `noindex, follow`, removed from the sitemap and public navigation. Empty blog lists are also excluded and marked `noindex`; publishing the first article restores the blog and article URLs automatically, per available locale.
- Nine template detail routes now expose localized descriptions, original English prompts, three reference images and related-template links. Homepage cards link to these routes. Generation availability is stated explicitly; generation and payment services require no change.
- With no published articles, the sitemap contains 32 URLs (16 English and 16 Chinese). Existing canonical, `en`/`zh`/`x-default` alternates and locale-specific Open Graph metadata are retained. No migration or environment change is required.
- Verify a built preview with `python3 scripts/verify-seo.py --base-url http://127.0.0.1:4175`. Details and production verification URLs are in `docs/research/seo-fixes-2026-11-03.md`.

## 2026-11-03 — Ordinary-user journey fixes

- Account navigation now normalizes locale prefixes, uses a single link per item, and keeps the overview active only on its own page. Profile updates refresh the authentication session so the account name changes immediately. Shared user-info queries retain one consistent response shape.
- Form validation, image uploads, dialogs, error pages and all nine template prompts now have Chinese copy. Credit and subscription links say “Credit guide” because this project’s pricing page explains usage costs rather than selling plans.
- Image/video controls on `/create` update the URL; header navigation selects the requested mode. Loading failures show a retry action rather than an empty balance/history, and a closed guest-post feature no longer offers new submissions or payment.
- Saved dark mode hydrates without a text mismatch. Optional footer badge failures no longer take down the root page. Email-verification callbacks use the shared same-origin and auth-loop validation.
- Template detail actions preserve the selected template and its image/video mode in the workspace; unknown template query values safely fall back to the default style.
- Successful sign-out cancels pending queries and clears the browser query cache, so switching accounts cannot reuse the previous account's profile or records.
- Development D1 now accepts `DATABASE_D1_REMOTE=true` (shared remote data) or `false` (local D1), independently of the Wrangler file that deployment regenerates. Empty preserves the binding’s original behavior. This project’s ignored `.env.development` opts into the shared remote database. No schema migration or permission-code change is required.

## 2026-11-03 — GitHub to Cloudflare Workers deployment

- `deploy/cloudflare.json` is the public production configuration for `vikaseditor`, its existing D1 binding, and `https://vikas-editor.net`. `pnpm cf:build` and `pnpm cf:deploy` materialize the ignored root `wrangler.jsonc` and use these same values at build time and runtime. Node 22 or newer is required. Cloud builds do not need a local `.env.production`.
- Keep `AUTH_SECRET` and `CONFIG_ENCRYPTION_KEY` in Cloudflare Worker Secrets; never commit them or rotate the encryption key during routine deployments. Cloudflare Builds runs `pnpm run cf:deploy` for pushes to `main`.
- Drizzle migration history is now committed. The existing baseline is already applied to production. For future schema changes, generate and review SQL before applying `pnpm cf:migrate`; ordinary code deployments do not modify the database schema.

## 2026-11-03 — Vikas homepage and studio quality refinement

- The homepage now offers a direct photo upload and places the studio immediately after the template collection. Six templates appear initially; a stable expand/collapse action exposes all nine. Editorial guidance remains below the creation workflow.
- A photo selected from the hero opens its local preview in view, even when the native file picker interrupts scrolling. Upload validation appears beside the upload control. Generation availability appears before the action; the unavailable state disables generation.
- Mobile controls retain 44 px touch targets, the upload CTA remains 52 px, and form inputs use 16 px text. The mobile menu closes with Escape and restores focus. The generic mobile button fallback no longer overrides larger component targets.
- Dark remains the default; the complementary light palette is available through the header or mobile menu. No database migration, provider configuration change or new environment variable is required.

## 2026-11-03 — Launch audit fixes

- Light and dark now have separate semantic palettes. Marketing navigation exposes the theme toggle; mobile forms, menu controls and template actions have larger touch targets. Auth pages have a semantic heading and private routes emit `noindex, nofollow`.
- Public pages share canonical, language and social metadata; the sitemap includes both locale URLs. JSON-LD escapes HTML delimiters. Template demo blog articles are no longer registered for publication; the MDX sources are retained for reference.
- The showcase uses six individually lazy-loaded WebP panels (the hero panel has high priority) and a separate 1200 × 630 social JPEG. Fonts load Latin subsets, theme labels no longer pull all admin translations into public pages, and Nitro emits compressed static assets.
- Uploads require a same-origin request, enforce the actual streamed body limit, and validate raster signatures before storage. Non-browser upload clients must include the site's `Origin` header. Upload/payment failures no longer echo provider errors. Session-token responses disable caching. Auth redirects reject backslashes, control characters and localized auth loops.
- Docker excludes **all** real environment files and uploaded files. Supply public `VITE_*` settings using build arguments and inject `AUTH_SECRET`, `CONFIG_ENCRYPTION_KEY`, database and provider credentials at runtime. No secrets are needed to build. The env loader now follows the documented `.env.{NODE_ENV}` → `.env.local` → `.env` order, while explicitly supplied process variables still win.
- Run `pnpm install` for patched `seroval`, `minimatch` and the legacy Drizzle esbuild dependency. Overrides are mirrored in `pnpm-workspace.yaml` for pnpm 11 and `package.json` for pnpm 10 Docker builds. The low-severity deepmerge 4.3.1 advisory remains: its announced 4.3.2 version was unavailable in npm at audit time. No database migration is required.
- See `docs/launch-audit-2026-11-03.md` for measured results and remaining launch checks.

## 2026-11-03 — Vikas Editor AI content and support details

- Public copy in `messages/en.json` and `messages/zh.json` now describes AI image and video creation for creators in India and worldwide. This project has no `index.json`; these message files and `src/config/index.ts` supply its brand content.
- Both language versions of the privacy policy and terms now describe the generation workflow and link to `support@vikas-editor.net`. The public footer also includes an email support link.
- If an existing deployment overrides `VITE_APP_DESCRIPTION`, update it to match the new image/video positioning. No database migration or new environment variable is needed.

## 2026-11-03 — Vikas editorial brand and SEO pages

- The public footer no longer shows the bottom copyright/ShipAny attribution row or its divider. When cookie consent is enabled, its settings button appears with the legal links.
- Homepage copy now includes roughly 1,300 English words across style guidance, photo preparation, prompt tips and FAQs, with matching Chinese translations. The prompt example can be sent directly to the studio.
- The public home, generation studio, credit page and legal pages now use a graphite/champagne identity, a frame-corner V mark, Archivo/DM Sans and a self-hosted Cormorant Garamond accent. Optional admin appearance presets are unchanged.
- `/`, `/create` and `/pricing` have route-specific titles, descriptions, canonical and language alternate links. `/create` is included in the sitemap. The root no longer attaches homepage language alternates to unrelated pages.
- No database migration or new secret is required. Run `pnpm install` to install the additional font package. Production builds must retain `VITE_APP_URL=https://vikas-editor.net`; use the active localhost URL for local development.

## 2026-11-03 — Vikas Editor AI studio

- The public homepage now introduces Vikas Editor AI with an original template library and a photo/video studio. `/create` opens the public studio; `/settings/studio` adds the studio to the account sidebar. `/pricing` describes generation credit costs rather than exposing the template demo subscription plans.
- Configure **Admin → Settings → AI → Fal** and grant account credits to enable generation. The new server catalog (`src/config/generation.ts`) charges 4 credits per image and 20 per 5-second video. No model keys are shipped to the browser. No schema migration is required.
- New `/api/generations` endpoints validate raster uploads, isolate owner history, atomically claim requests and debit credits, and refund confirmed failed tasks. `planRevoke` is an additive credits-service export for composing refunds into atomic updates. Source photos are not saved in the database; generated files remain provider-hosted and should be downloaded before their links expire.
- A provider submission with uncertain acceptance is not automatically resubmitted or refunded. Reconcile it with Fal before compensating the account; this version has no webhook/reconciliation worker. See `docs/research/generation-integration.md`.
- Production branding/domain defaults are `Vikas Editor AI` and `https://vikas-editor.net`. Keep local `VITE_APP_URL` on the active development port for authentication. Dark appearance uses Archivo/DM Sans and an original yellow-green identity. English and Chinese content are included.

## How to upgrade (every time)

1. **Find the baseline.** The last template commit the project took. Check
   `git log` for a `Template-sync:` trailer. If there isn't one, use the date of
   the last template pull.
2. **Bring the code over.** Merge or cherry-pick the template changes. When a
   file conflicts, keep the project's own changes, but re-apply the template's
   fixes inside it. Never keep the project's old copy of one service while
   taking the template's new copy of a service that depends on it, or the build
   breaks. Pairs that must move together are listed in each entry.
3. **Port the schema by hand.** `src/config/db/schema.ts` is the project's
   gitignored working copy, so pulling does not update it. Diff the template's
   `schema.<dialect>.ts` against the previous version and copy the new
   columns and tables into `schema.ts`.
4. **Apply the schema.**
   - Dev: `pnpm db:push`.
   - Production: `pnpm db:generate`, review the SQL, then `pnpm db:migrate`.
   - Cloudflare D1: re-run `/deploy-cloudflare`. Its Phase 4 generates and
     applies migrations.
5. **Register new permissions.** Run `pnpm admin:token sync-permissions`. It
   adds missing `admin.*` permission rows and never changes role assignments.
   Re-running `/deploy-cloudflare` does **not** do this, because it skips RBAC
   once roles exist. For remote D1, run the command against the local D1 copy
   and apply the `INSERT OR IGNORE` dump, the same way Phase 4.5 of that skill
   does. `super_admin` holds `*` and works without this step. You only need the
   new rows to grant new permissions to other roles.
6. **Install and verify.** Run `pnpm install`, `pnpm build`, and the
   `pnpm test:*` scripts. On Workers, also run `pnpm cf:build`.
7. **Record the sync.** End the upgrade commit with
   `Template-sync: <template sha>`.
8. **Hand over what code can't do.** Some items need the project owner:
   deployment env vars, running migrations on production, re-entering
   secrets. List every such unchecked item to the user when the upgrade is
   done, with the exact value to set (e.g. `PLAUSIBLE_SCRIPT_HOSTS=stats.example.com`,
   taken from the project's own settings), not just a link to this file.

When you change the template itself, add an entry here for anything an
existing project must act on. That covers schema, env vars, renamed or removed
exports, permission codes, and behavior that changes for end users.

---

## 2026-11-03: D1 bindings in local Vite development

Local `pnpm dev` now supports `DATABASE_PROVIDER=d1`. Configure `account_id`
and a `DB` D1 binding in `wrangler.jsonc`; setting its `remote` flag to `true`
makes local development use that remote database via the official D1 HTTP
API. Wrangler supplies and refreshes authentication; credentials stay in
server memory. Requests honor the machine's HTTP proxy. Batches remain one
request, with no automatic retries of writes. Without `remote`, Wrangler's
local platform proxy is used instead.
Clear `DATABASE_URL` when switching away from SQLite. Wrangler login is
required for remote bindings. Workers production continues using its native
binding, without bundling the development proxy.

For D1 schema changes, run `pnpm db:generate`, review the SQL, then
`pnpm exec wrangler d1 migrations apply DB --remote --config wrangler.jsonc`.
Direct Drizzle database commands refuse D1 rather than falling back to the
previous SQLite database. Use the Cloudflare D1 console to inspect data.
`D1_HTTP_INTEGRATION=1 node --import tsx --test tests/d1-http.test.ts` verifies
remote rollback and concurrent guards using a disposable table.

Take the `remoteBindings: false` option in `tests/atomic.test.ts` with this
change so the D1 tests always use an isolated local database, even when the
application uses a remote binding.

## 2026-11-02: First-party operations dashboard

`/admin/operations` adds same-time today/yesterday comparisons (UTC+08:00),
per-currency net revenue, unpaid checkout users, AI health, first-touch
visitor cohorts by channel/country/entry/build, daily reports, CSV export,
and an experiment journal. The shared admin operations also expose these
reports and logs to authenticated agents; no external analytics service is
required. The journal does not allocate A/B traffic or change prices.

### Action required

- [ ] Copy `analyticsVisitor` and `operationsExperiment` from the matching
      schema template into `schema.ts`. For development run `pnpm db:push`;
      for production generate and review migrations before applying them.
- [ ] Run `pnpm admin:token sync-permissions` to register
      `admin.operations.read` and `admin.operations.write`. Existing super
      administrators work immediately. Grant the explicit codes to other
      roles as needed; the command preserves current role assignments.
- [ ] Take the operations tracker, root integration, auth signup hook,
      signed-cookie helper, build configuration, module, admin operations,
      routes, blocks and translations together. Visits start being collected
      after installation. Historical anonymous visits cannot be reconstructed.
- [ ] Visitor collection honors cookie consent, DNT and GPC. Entry pages
      exclude queries; no IP addresses or raw referrers are stored in the
      new table. First-touch cohorts remain fixed across return visits.
      Authenticated users are deduplicated to the earliest linked browser;
      staff with active admin-access roles, API accounts and marked test
      browsers are excluded. Mark a fresh test browser's first public visit
      with `?ops_test=1` to exclude it.
- [ ] Builds embed the current Git revision. Optionally set `VITE_BUILD_ID`
      in CI for a release label (maximum 191 characters). Cohort revenue
      excludes renewals; daily totals include them. Recorded refunds revise
      the original payment day. Each currency stays separate.
- [ ] Run `pnpm test:operations` and `pnpm build`. Provider-balance estimates,
      automatic A/B traffic and scheduled reports require product-specific
      integrations and are not enabled by the journal.

## 2026-10-31: IndexNow administration

The admin sidebar now includes `/admin/indexnow`: save an ownership key,
verify `/{key}.txt`, and submit sitemap URLs or specific changed pages.
The existing `config` table stores `indexnow_key`; no schema migration or
additional package is needed. This public verification token is managed by
IndexNow, excluded from general/custom settings, and read without caching.

### Action required

- [ ] Run `pnpm admin:token sync-permissions` to register
      `admin.indexnow.read`, `admin.indexnow.write`, and
      `admin.indexnow.submit`. Super admins already have access. Grant the
      explicit codes to other roles as needed; ordinary admin seeds grant
      read and submit, while key changes require a separate write grant.
- [ ] Set `VITE_APP_URL` to the public site's origin before deploying and
      save your IndexNow key on the new page. Local preview supports saving
      and checking the key file; external submission is disabled for local
      origins. Each request accepts at most 10,000 same-host URLs.
- [ ] Submission acceptance (HTTP 200/202) is not a guarantee of indexing.

## 2026-10-31: Install administrator-managed footer badges

Super administrators can manage HTTPS badge links at `/admin/footer-badges`.
Badges are stored under `footer_badges` in the existing `config` table;
no schema change or database migration is required. The generic settings
and custom settings APIs cannot overwrite or remove this module-owned key.

Take the footer-badges feature, module, admin handlers/operations, routes,
translations, root loader, public config, user permissions endpoint, footer
block/component, and marquee CSS together. Custom footers can render badges
through the new optional `SiteFooter.badges` slot. Keep the root loader
integration so badges appear in server-rendered HTML for backlink verification.

The new `admin.footer-badges.read` and `admin.footer-badges.write` operations
also require the global `*` permission; ordinary administrator wildcards
cannot grant access. Existing super administrators work without re-seeding.
No badges appear until one is added in the admin page.

## 2026-10-31: Hide the footer attribution by default

`SiteFooter` no longer displays the "Built with ShipAny" badge by default.
No action is required to hide it. Projects that want to display it can pass
`builtWith="pill"` or `builtWith="text"` explicitly.

## 2026-10-31: Load the translation plugin locally

The message-format plugin is now an installed development dependency instead
of a jsDelivr download at dev/build time. An unavailable CDN could previously
produce an empty message module and crash pages with errors such as
`m.landing.nav.features is not a function`.

### Action required

- [ ] Take `package.json`, `pnpm-lock.yaml`, and
      `project.inlang/settings.json` together, run `pnpm install`, and restart
      `pnpm dev` to regenerate `src/paraglide/`. Translation keys and locale
      URLs are unchanged.

## 2026-10-28: Dependency security upgrade

`pnpm audit` went from 189 advisories (8 critical, 78 high) to 2 (one
moderate in `drizzle-kit`'s bundled esbuild, dev-only; one low in
`deepmerge`, no fix published). Notable: TanStack Start (reflected XSS),
drizzle-orm 0.45 (SQL injection via identifiers), vite, undici, ws, postcss,
zod, markdown-it, tiptap/prosemirror (paste XSS). Major versions were not
taken (stripe, resend, lucide-react, motion, TypeScript, react-table).

### Action required

- [ ] **Lockfile**: take `package.json` and `pnpm-lock.yaml`, run
      `pnpm install`, then `pnpm audit`.
- [ ] **`next` override**: `pnpm.overrides.next = "-"` stops pnpm from
      installing Next.js as better-auth's optional peer (it carried most
      of the critical advisories and is never used here). Keep it.
- [ ] **Server functions**: TanStack Start renamed `.inputValidator()` back
      to `.validator()` on `createServerFn`. The old name is gone at runtime
      too (the build still passes, the call throws), so search your own code
      for `inputValidator` and rename it.
- [ ] **Docker**: rebuild with `docker build --pull` so `node:22-alpine`
      picks up the latest Node 22 security release.

## 2026-10-28: Subscription renewals could skip credits (fix)

Since the 2026-10-11 renewal hardening, a renewal was treated as "already
handled" whenever the subscription's stored period had already moved forward.
Stripe sends `customer.subscription.updated` (new period) and
`invoice.payment_succeeded` (the payment) together, and the update usually
arrives first. When it did, the payment was dropped silently: the user was
charged, but no renewal order and no credits were created. Creem and PayPal
went through the same path.

Renewals are now claimed by a renewal order number derived from the period
(`<subscriptionNo>-<periodStartMs>`, unique), so event order no longer
matters. Subscription updates only move the period forward.

### Action required

- [ ] **Merge**: take `handleSubscriptionRenewal` and
      `handleSubscriptionUpdated` in `src/modules/payment/service.ts` together,
      plus `tests/payment-idempotency.test.ts`. No schema change.
- [ ] **Find missed renewals** if the project ran the 2026-10-11 code with
      recurring plans. Compare the provider's paid renewal invoices (Stripe:
      `billing_reason = subscription_cycle`) since then with
      `order` rows where `payment_type = 'renew'`. Grant the missing credits
      by hand from the admin, and contact the affected users.
- [ ] **Custom renewal code**: if you look up renewal orders by `order_no`
      format, note the new format above. Older renewals keep their snowflake
      numbers.

## 2026-10-17: Guest posts (off by default)

Outside authors can submit paid articles: they write at
`/settings/guest-posts` and pay to submit, an admin reviews at
`/admin/guest-posts`, and an approved article is published to the blog with
a Sponsored label and `rel="sponsored nofollow"` links. Rejecting refunds the
author in full; a refund from the Payments page has the same effect.
`/guest-post` explains it publicly. It stays off until an admin turns on
Settings → Users → Guest Posts → Accept guest posts.

A paid submission or a free resubmission sends a bot message through the
admin Notify settings (on by default; switch Notify → Guest posts off
to stop it). No emails are sent: authors follow the review result at
`/settings/guest-posts`. Admins can also take a published post down and
later republish it or send it back for changes.

### Action required

- [ ] **Schema**: one new table, `guest_post`, and one new nullable column,
      `order.reference` (what an order buys beyond its product, e.g.
      `guest_post:<id>`). Port both into `schema.ts` from the template for
      your dialect and apply them (steps 3–4).
- [ ] **Permissions**: run step 5 to register `admin.guest-posts.read`,
      `admin.guest-posts.review` and `admin.guest-posts.reject`. New seeds give
      read/review to `admin` and `editor`; reject refunds money, so only
      `super_admin` (`*`) has it until you grant it explicitly. Existing roles
      need them granted by hand.
- [ ] **Pricing**: `src/config/pricing.ts` gains two guest post packages
      (`kind: 'guest_post'`). Adjust their prices or remove them. If you use
      Creem, map them in `creem_product_ids_mapping`.
- [ ] **Merge pairs**: `modules/payment/service.ts` now calls
      `modules/guest-posts/service.ts`; take both together. The generic
      checkout's price logic moved to `src/server/payment/charge.ts`.
- [ ] **Blog**: `/blog/<slug>` now serves only `article` and `guest` posts.
      A published `page` or `log` post is no longer reachable there.
- [ ] **Bot notifications**: payment, ticket and guest post messages now start
      with the site name (`【<App Name>】Stripe 收款成功`) instead of a
      `产品：/Product:` line. Webhook `data.app_name` is unchanged; update any
      automation that matched the old message text.
- [ ] **Customized posts admin**: `/api/admin/posts` hides and refuses
      `guest` posts; keep that check if you merge it by hand.
- [ ] **Custom checkout callers**: `/api/payment/checkout` (and the guest
      post checkout) now take an optional `locale` and send the buyer back to
      that locale's success/cancel page. Pass `getLocale()` if you call them
      from your own UI; without it the buyer lands on the default locale.

---

## 2026-10-17: Users settings tab; user-center pages can be switched off

Admin Settings has a new **Users** tab after General. Signup credits, default
role and a new **User Features** group moved there, as did the Guest Posts
settings (the Guest Posts tab is gone). User Features switches the optional
user-center pages, defined in `src/config/user-features.ts`. A page that is
off disappears from the sidebar and the overview, and opening it sends the
user to the overview:

- **Credits** (`credits_enabled`), **Billing** (`billing_enabled`) and
  **Payments** (`payments_enabled`), on by default. Their read-only APIs keep
  working (the balance is shown elsewhere too). With Billing off, users
  can't cancel a subscription themselves.
- **API keys** (`apikeys_enabled`), **off** by default. `/api/apikeys` also
  refuses to list, create or delete keys while it is off. Existing keys stay
  in the database.
- **Support tickets** (`tickets_enabled`), on by default. While off, the
  floating support button disappears too and the user `/api/tickets` routes
  refuse. Admins still see existing tickets.

### Action required

- [ ] **Projects whose users use API keys**: turn the API keys switch on, or
      users lose the page after the upgrade.
- [ ] **Your own routes that call `validate()` from
      `@/modules/apikeys/service`**: it doesn't check the switch. If keys
      should stop working while it is off, add
      `if (!(await userFeatureEnabled('apikeys_enabled')))` from
      `@/server/user-features` to that route.

No schema or permission changes.

---

## 2026-10-17: Per-project session cookies in dev

Browsers share cookies across ports, so several projects running `pnpm dev`
on `localhost` overwrote each other's `better-auth.*` session cookie, and a
reload in one project signed you out of all of them. In dev the cookie prefix
now comes from `AUTH_COOKIE_PREFIX`, or else a slug of `VITE_APP_NAME` (e.g.
`My App` → `my-app.session_token`). Production keeps `better-auth` unless
`AUTH_COOKIE_PREFIX` is set, so deployed users stay signed in.

### Action required

- [ ] **Code that reads `better-auth.session_token` directly**: build the name
      from `getAuthCookiePrefix()` (`@/core/auth`) instead, as
      `src/routes/api/auth/token.ts` does. Otherwise it breaks in dev.
- [ ] **Several local projects with the same `VITE_APP_NAME`**: give each a
      different `AUTH_COOKIE_PREFIX` in `.env.development`.

Local dev sessions sign out once after the upgrade. No schema, permission or
production changes.

---

## 2026-10-17: ShipAny attribution markers

- Every response now carries `X-Powered-By: ShipAny`, and every page has
  `<meta name="generator" content="ShipAny">`. Both identify the stack, much
  like WordPress's generator tag.
- The footer's "Built with ShipAny" badge inherits the surrounding text
  color, and `SiteFooter` takes `builtWith="pill" | "text"`.
- `LICENSE` clarifies that the "Built with ShipAny" link is optional: keep,
  restyle, move or remove it. Only copyright notices in the source code must
  stay.

### Action required

- [ ] **Customized `src/server.ts` / `__root.tsx` / `site-footer.tsx`**:
      merge the template changes (`withPoweredBy` in the server entry, the
      generator meta, the `builtWith` prop).

---

## 2026-10-17: Appearance settings (off by default)

Admin Settings → General → Appearance gets a master switch, **Enable
appearance settings** (`appearance_enabled`). It is **off by default**, and
while off the site renders exactly from code: the `:root`/`.dark` palette in
`globals.css`, the fonts there, `DEFAULT_APPEARANCE` for the sidebar, light/dark
per visitor, and `<Toaster richColors>`. No `data-theme` attribute or inline
style is put on `<html>`.

Turned on, the admin picks:

- **Light / dark** (`app_color_mode`): the default for visitors who haven't
  picked one. With "Let users pick their own theme color" off, Light or Dark
  is forced on everyone and the toggles are hidden.
- **Site theme** (Classic, Forest, Ocean, Violet, Sunset, Rose, Slate): this
  replaces the code palette (Classic is a layered neutral, not your
  `:root`). The colored themes paint the dashboard sidebar and tint the main
  area.
- **Font** (Inter, System, Rounded, Serif). Self-hosted, OFL-licensed.
- **Font size** (Small, Medium, Large): scales rem, like browser zoom.
- **Sidebar style** (Inset, Floating, Classic = shadcn `variant`) and
  **collapse** (hide completely, or collapse to icons = shadcn `collapsible`).
- **Let users pick their own theme color** (`user_theme_enabled`): adds a
  theme color picker to the user menu (cookie `app_theme`). Users can change
  nothing else.

Appearance fields save on click. Presets live in `src/config/appearance.ts`.

### Action required

- [ ] **Install**: `pnpm install` (adds `@fontsource-variable/nunito` and
      `@fontsource-variable/source-serif-4`).
- [ ] **`src/styles/globals.css`**: the template only _adds_ a "Color themes"
      block and a toast block; `:root`/`.dark` are unchanged. Keep your
      palette and copy those two blocks in.
- [ ] **Dashboard sidebar header** (always on, not behind the switch): the
      brand row is now as tall as the content header, so it lines up with the
      sidebar toggle. It also shows the `VITE_APP_LOGO` image (default
      `/logo.svg`) when that URL loads. Check that your logo looks right
      there. The template's `.env.example` used to point at a missing
      `/logo.png`; fix it in your env files if you copied that.
- [ ] **`<html data-theme>`**: if your project (or a library such as
      daisyUI) already uses `data-theme` on `<html>`, keep the switch off or
      rename one of them.
- [ ] **Customized `__root.tsx`**: keep the template's `ThemeProvider`
      `defaultTheme`/`forcedTheme` and `Toaster richColors` expressions. If you
      had hard-coded `defaultTheme="dark"`, set `DEFAULT_COLOR_MODE = 'dark'`
      in `src/config/appearance.ts` instead.
- [ ] **Customized `app-sidebar.tsx` / `app-layout.tsx` / `user-menu.tsx`**:
      merge the new props (`variant`, `collapsible`, `logo`), and keep sidebar
      text on `sidebar-foreground` tokens so it stays readable on a colored
      sidebar.

No schema, env or permission changes.

---

## 2026-10-12: Activity timeline, product events, admin password reset

### Action required

- [ ] **Schema**: one new table, `user_event` (product events). Port it into
      `schema.ts` from the template for your dialect and apply it (steps 3–4).
      Nothing existing changes.
- [ ] **Permissions**: run step 5 to register `admin.passwords.reset`.
- [ ] **Self-hosted Plausible** (only if admin Settings → Analytics → Plausible
      script URL is a full URL on a host other than `plausible.io`): set the
      server env var `PLAUSIBLE_SCRIPT_HOSTS` to that host, e.g.
      `PLAUSIBLE_SCRIPT_HOSTS=stats.example.com`. On Workers put it in
      wrangler `vars`; on Docker/Node in the container or server env. A
      restart or redeploy is enough. Until it is set, the script does not load
      and saving that URL is refused. This replaces the build-time
      `VITE_PLAUSIBLE_SCRIPT_HOSTS` from 2026-10-11, which still works.
      Same-site proxy paths like `/js/script.js` need nothing.

### New, no action needed

- **Settings save** only validates fields that changed, so a stored
  Plausible URL that no longer passes no longer blocks saving the rest of
  the tab (e.g. the Google Analytics ID). The save error names the host to
  add.

- **Product events**: register kinds in `src/config/events.ts`. Record them
  with `recordEvent()` (`@/modules/events/service`) on the server, or with
  `track()` (`@/lib/track`) from the browser for kinds marked
  `client: true`. Browser reports go through `POST /api/events`, which is
  signed-in only, same-origin only, rate-limited, and capped to a small flat
  detail. `PricingTable` reports `plan_selected`. See AGENTS.md → "Product
  events".
- **Custom timeline sources**: `src/server/admin/timeline-sources.ts` plugs
  rows from the project's own tables into the timeline.
- User detail page: an "Activity" timeline (`users_timeline`,
  `GET /api/admin/users/timeline?userId=`, `users.read`). Built-in events
  come from existing tables, so existing history shows up right away: sign-up,
  orders created, paid, closed and refunded, subscriptions, credit grants and
  charges, AI tasks and tickets. It shows oldest first by default, with a
  toggle. Each row opens its record. The subscriptions and credits admin pages
  now accept `?search=`.
- Admin users list: "Set password" in the row menu
  (`users_set_password`, `POST /api/admin/users/password`). It needs the
  dedicated `admin.passwords.reset` code, which sits outside `admin.users.*`
  so the `admin` role does not pick it up; only `super_admin` has it unless you
  grant it (run step 5 to register the row). It signs the user out everywhere,
  adds an email/password login for OAuth-only users, refuses agent API keys,
  and refuses users whose roles exceed the caller's permissions. The row menu
  is also wider so labels no longer wrap.

---

## 2026-10-11: Atomic writes on D1, payment hardening, Agent API

### Action required

- [ ] **Schema** (additive only, nothing is dropped). Port these into
      `schema.ts`, then apply them (steps 3–4):
  - `user.type`: text, not null, default `'user'`. Agent accounts use `'api'`.
  - `apikey.type`: text, not null, default `'user'`. Agent keys use `'admin'`.
  - `apikey.expires_at`: nullable timestamp_ms. Null means the key never expires.
  - `order.refund_amount`, `order.refunded_at`, `order.refund_result`.
  - The new table `admin_execution`.
  - The `utm_*`, `referrer` and `country` columns on `user`, if the project
    predates them.
- [ ] **Alipay / WeChat Pay**: every product sold through them needs
      `cnyPriceInCents` in `src/config/pricing.ts`. Without it those providers
      now refuse the product. Previously a USD price was silently charged as CNY.
- [ ] **Dependencies**: run `pnpm install`. better-auth is now `^1.7.7`, and
      `seroval`/`seroval-plugins` are pinned to `1.6.8` through pnpm overrides.
- [ ] **Permissions**: run step 5. New codes include `admin.payments.refund`
      and the analytics and agent operations.
- [ ] **Self-hosted Plausible**: superseded by the 2026-10-12 entry (runtime
      `PLAUSIBLE_SCRIPT_HOSTS`, no rebuild). Old text kept for reference: if
      `plausible_src` is a full URL on a host
      other than `plausible.io` (e.g. `https://stats.example.com/js/script.js`),
      add that host to `VITE_PLAUSIBLE_SCRIPT_HOSTS` (comma-separated, exact
      hostnames) and **rebuild**. It is a `VITE_` var, so it is baked into the
      client bundle: put it in `.env.production` or the build environment.
      Setting it only at runtime (or only in wrangler `vars`) does not work.
      Without it the script silently stops loading; the stored setting is kept
      and works again once the host is listed. Also switch any `http://` URL to
      `https://`. Same-site proxy paths such as `/js/script.js` keep working
      with no change.
- [ ] **Initial role**: if `initial_role_name` in admin settings points at a
      role that grants admin access, point it at a non-admin role. Otherwise new
      signups get no role (see "Behavior changes").
- [ ] **Optional data repair (D1 deployments only).** Before this change, a
      write that failed halfway on D1 could leave an order marked paid with no
      credits. Find such orders:
  ```sql
  SELECT o.order_no, o.user_id, o.credits_amount FROM "order" o
  WHERE o.status = 'paid' AND o.credits_amount > 0
    AND NOT EXISTS (SELECT 1 FROM credit c
      WHERE c.order_no = o.order_no AND c.transaction_type = 'grant');
  ```
  Grant the missing credits from the admin console after checking each one.

### Breaking code changes (only if the project calls these directly)

- `deductForRefund(...)` was replaced by `planDeductForRefund(...)`, which
  returns `{ deducted, steps }`. Run the steps with `atomic()`.
- `consume(...)` no longer accepts `tx`. To charge credits together with your
  own writes, use `planConsume(...)` and put its `steps(q)` into the same
  `atomic()` call. `src/modules/ai-tasks/service.ts` shows how.
- `enforceMinIntervalRateLimit` no longer reads cookies. Passing `extraKey`
  now keys the limit to that value, the user id, **instead of** the IP.
- **Move these together:** `src/core/db/atomic.ts`,
  `src/modules/credits/service.ts`, `src/modules/payment/service.ts` and
  `src/modules/ai-tasks/service.ts`.

### Behavior changes users may notice

- **OAuth linking**: signing in with Google or GitHub no longer attaches to an
  existing password account whose email was never verified. This closes the
  pre-registration account takeover.
- **Endpoint secrets**: changing `openai_base_url`, `anthropic_base_url` or
  `r2_endpoint`, `telegram_api_base` or `notify_webhook_url` in settings now
  requires re-entering the matching secret.
- **Uploads**: at most 10 files and 20 MB per request, 10 MB per file. Only
  jpg/png/webp/gif/avif/heic are accepted. SVG is refused because it can carry
  script, and the stored extension comes from the MIME type, never the filename.
- **Rate limits**: requests are now limited per IP, and per user once signed in.
- **Initial role**: a role that grants admin access (`*`, `admin.*`) can't be
  set as `initial_role_name`, and signup also re-checks it. If an existing
  project already points `initial_role_name` at such a role, new users now get
  no role at all (an error is logged). Point it at a non-admin role.
- **Payment test amount**: `<provider>_test_amount` now applies only to users
  with `admin.access`. Everyone else pays the catalog price.
- **Credits**: `consume` rejects amounts that aren't positive integers, and
  fails with "insufficient credits" instead of under-deducting when the
  balance runs out mid-way.
- **Refunds**: refunding requires `admin.payments.refund`. Only `super_admin`
  holds it by default; the `admin` role no longer picks it up through
  `admin.payments.*`.
- **Admin order edit**: the status can only go from an unpaid order
  (`created`/`pending`) to `failed`. Paid, refunding and refunded states change
  only through checkout and refunds. Before this, moving a paid order back to
  pending let the next payment notification grant its credits again.
- **Checkout settlement** additionally requires `paid_at` to be empty and no
  existing grant for the order. New grants use `transaction_no =
grant_<orderNo>`, so the unique index allows one grant per order. Older
  rows keep their numeric transaction numbers.
- **Alipay / WeChat**: notifications are checked against the configured
  `app_id` / `mchid` and the order amount. Mismatches are rejected.
- **Embed IDs are validated**: `google_analytics_id`, `adsense_code`,
  `crisp_website_id`, `tawk_property_id`, `tawk_widget_id` must match their
  provider's format (see `src/lib/embed-ids.ts`), and `plausible_src` must be
  a same-site path or an https URL on `plausible.io` or on a host listed in
  the deployment env `PLAUSIBLE_SCRIPT_HOSTS` (since 2026-10-12; previously
  the build-time `VITE_PLAUSIBLE_SCRIPT_HOSTS`). Bad values are refused on save. Values already stored in the
  database that don't match are no longer rendered, so check these settings
  after upgrading.
- **Checkout return page**: after a successful payment the user now lands on
  `/settings/payments` by default (pricing block, `PricingTable`, and the
  checkout/callback fallbacks). If the project pointed it somewhere else on
  purpose, keep its own `callbackUrl`.
- **Admin search**: the search boxes on users, payments, subscriptions, credits,
  tickets and invite codes are case-insensitive on every database. They also
  match the account's email and name, and an exact user ID. Subscription search
  used to be ignored by the API; it now filters.

### New, no action needed

- `atomic()` / `guard()` in `src/core/db/atomic.ts`. See AGENTS.md
  → "Atomic writes".
- Admin Agent API (`/admin/agent`), the conversion funnel, overview KPIs and the
  `analytics_report` operation. See `docs/admin-agent.md`.
- `src/lib/sql-search.ts` for admin list search.
- `src/components/user-cell.tsx` (`UserCell`): avatar + name + email that
  links to `/admin/users/$id`. Payments, subscriptions, credits and tickets
  open it in a new tab.
- Admin users list: ID column with copy, effective roles column, and a
  `utm_source` filter (`users_sources` operation, `GET /api/admin/users/sources`,
  `users.read`). The subscriptions and credits list APIs now also return
  `userName` / `userImage`.

## 2026-11-03 — Footer badge rendering and import

Footer badges now accept image or text links, preserve qualified `rel` values, and ignore safe presentation markup. Existing image records remain compatible. Keep `FooterBadgeList` mounted in custom marketing footers; the root loader supplies its server-rendered data so reciprocal-link verifiers can read the initial HTML. Rebuild and deploy to apply this change.
