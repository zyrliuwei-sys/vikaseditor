import { defineConfig } from 'drizzle-kit';

import { loadEnvFiles } from './src/lib/env';

loadEnvFiles();

const provider = process.env.DATABASE_PROVIDER || 'sqlite';

// D1 uses Wrangler bindings rather than a SQLite file URL. Refuse database
// commands here so switching to D1 cannot silently modify the old local.db.
// `generate` remains available: D1 shares the SQLite schema dialect.
if (
  provider === 'd1' &&
  process.argv.some((arg) =>
    ['push', 'migrate', 'studio', 'pull', 'introspect'].includes(arg)
  )
) {
  throw new Error(
    'D1 schema changes: run pnpm db:generate, review the SQL, then ' +
      'pnpm exec wrangler d1 migrations apply DB --remote --config wrangler.jsonc. ' +
      'Use the Cloudflare D1 console to inspect data.'
  );
}

const dialectMap: Record<string, 'sqlite' | 'postgresql' | 'mysql' | 'turso'> =
  {
    sqlite: 'sqlite',
    postgres: 'postgresql',
    postgresql: 'postgresql',
    mysql: 'mysql',
    turso: 'turso',
  };

const dialect = dialectMap[provider] || 'sqlite';

// Turso is a remote libsql database: it needs an auth token in addition to the
// libsql:// URL. Other dialects (sqlite/postgres/mysql) use the URL alone.
const dbCredentials =
  dialect === 'turso'
    ? {
        url: process.env.DATABASE_URL || 'file:data/local.db',
        authToken: process.env.DATABASE_AUTH_TOKEN,
      }
    : {
        url: process.env.DATABASE_URL || 'file:data/local.db',
      };

export default defineConfig({
  schema: './src/config/db/schema.ts',
  out: './drizzle',
  dialect,
  dbCredentials,
});
