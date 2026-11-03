# Cloudflare deployment

- Repository: https://github.com/zyrliuwei-sys/vikaseditor
- Production branch: `main`
- Worker: `vikaseditor`
- Site: https://vikas-editor.net
- D1: `vikaseditor`, binding `DB`

Cloudflare Workers Builds watches `main`. Its root directory is `/`, build
command is empty, and deploy command is `pnpm run cf:deploy`. Builds use the
`vikaseditor build token` and `PNPM_VERSION=11.15.1`. The deploy script
builds the application and deploys Nitro's generated Worker. Use Node 22 or
newer and pnpm 11.15.1. Preview branch deployments must stay disabled so an
unreviewed branch cannot deploy this production configuration. Worker version
preview URLs are also disabled in the production config.

`deploy/cloudflare.json` contains public production settings. The deploy script
copies it into the ignored `wrangler.jsonc` and supplies the same public values
to Vite. A fresh Git checkout needs no local `.env.production`. Local production
env files are optional and never committed. Authentication and encryption
secrets are stored separately in Cloudflare Worker Secrets and survive normal
deploys. Payment, email, storage, and AI credentials are configured in the
application's admin settings, which encrypt them in D1.

After changing code, commit and push to `main`:

```sh
git push origin main
```

Watch the Worker’s **Settings → Builds** or **Deployments** for the result.
Local edits without a Git push do not trigger a cloud deployment. A failed build
leaves the last successful deployed version active.

For a manual deployment from a logged-in local machine:

```sh
pnpm install --frozen-lockfile
pnpm run cf:deploy
```

Database migrations are separate from routine releases. Run `pnpm db:generate`,
review the generated SQL and obtain the production migration review required by
`AGENTS.md`, then run `pnpm cf:migrate`. Commit the SQL and Drizzle metadata with
the application change. The baseline migration is already applied; do not reset
the D1 database or rerun account seeding.
