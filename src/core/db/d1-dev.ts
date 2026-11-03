// Vite development only. Production uses Workers' native DB binding.
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';
import { EnvHttpProxyAgent, fetch } from 'undici';
import { getPlatformProxy, unstable_readConfig } from 'wrangler';

const exec = promisify(execFile);
const require = createRequire(import.meta.url);
const dispatcher = new EnvHttpProxyAgent();
type Query = { sql: string; params: unknown[] };
type RawResult = {
  success: boolean;
  results: { columns: string[]; rows: unknown[][] };
  meta: Record<string, unknown>;
  error?: string;
};

let credentials: Promise<string> | undefined;
let credentialsExpireAt = 0;

async function authToken(): Promise<string> {
  if (!credentials || Date.now() >= credentialsExpireAt) {
    credentialsExpireAt = Date.now() + 5 * 60_000;
    credentials = exec(
      process.execPath,
      [
        resolve(dirname(require.resolve('wrangler')), '../bin/wrangler.js'),
        'auth',
        'token',
        '--json',
      ],
      { timeout: 20_000, env: { ...process.env, WRANGLER_LOG: 'error' } }
    )
      .then(({ stdout }) => {
        const result = JSON.parse(stdout) as { token?: string };
        if (!result.token) throw new Error('Missing Wrangler token');
        return result.token;
      })
      .catch(() => {
        credentials = undefined;
        // Never include child-process stdout/stderr: it may contain credentials.
        throw new Error(
          'D1 authentication failed. Run pnpm exec wrangler login.'
        );
      });
  }
  return credentials;
}

const toResult = (result: RawResult) => ({
  success: result.success,
  meta: result.meta,
  results: result.results.rows.map((row) =>
    Object.fromEntries(result.results.columns.map((name, i) => [name, row[i]]))
  ),
});

export function createD1HttpBinding(accountId: string, databaseId: string) {
  if (
    !/^[a-f0-9]{32}$/i.test(accountId) ||
    !/^[a-f0-9-]{36}$/i.test(databaseId)
  ) {
    throw new Error(
      'Configure account_id and the DB database_id in wrangler.jsonc.'
    );
  }
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/raw`;

  async function query(queries: Query[]): Promise<RawResult[]> {
    if (!queries.length) return [];
    const response = await fetch(endpoint, {
      method: 'POST',
      dispatcher,
      headers: {
        Authorization: `Bearer ${await authToken()}`,
        'Content-Type': 'application/json',
      },
      // A batch stays a single D1 request; never split atomic() into requests.
      body: JSON.stringify({ batch: queries }),
      signal: AbortSignal.timeout(20_000),
    });
    const body = (await response.json()) as {
      success: boolean;
      result?: RawResult[];
      errors?: { message: string }[];
    };
    if (
      !response.ok ||
      !body.success ||
      !body.result?.every((r) => r.success)
    ) {
      if (response.status === 401 || response.status === 403)
        credentials = undefined;
      throw new Error(
        body.errors?.map((error) => error.message).join('; ') ||
          body.result?.find((r) => !r.success)?.error ||
          `D1 request failed (HTTP ${response.status})`
      );
    }
    return body.result;
  }

  class Statement {
    constructor(
      readonly sql: string,
      readonly params: unknown[] = []
    ) {}

    bind(...params: unknown[]) {
      return new Statement(this.sql, params);
    }

    async raw() {
      return (await query([this]))[0].results.rows;
    }

    async all() {
      return toResult((await query([this]))[0]);
    }

    run() {
      return this.all();
    }

    async first(column?: string) {
      const row = (await this.all()).results[0];
      return column ? (row?.[column] ?? null) : (row ?? null);
    }
  }

  return {
    prepare: (sql: string) => new Statement(sql),
    batch: async (statements: Statement[]) =>
      (await query(statements)).map(toResult),
  };
}

type DevBindings = { DB: unknown };
const state = globalThis as typeof globalThis & {
  __CF_ENV__?: DevBindings;
  __devD1Binding?: Promise<DevBindings>;
};

export async function ensureDevD1Binding(): Promise<void> {
  state.__devD1Binding ??= (async () => {
    const config = unstable_readConfig({ config: 'wrangler.jsonc' });
    const binding = config.d1_databases?.find(
      (db: { binding: string }) => db.binding === 'DB'
    );
    if (!binding)
      throw new Error('Configure a D1 binding named DB in wrangler.jsonc.');
    if (binding.remote) {
      return {
        DB: createD1HttpBinding(
          config.account_id || '',
          binding.database_id || ''
        ),
      };
    }
    const proxy = await getPlatformProxy<DevBindings>({
      configPath: 'wrangler.jsonc',
      envFiles: [],
      remoteBindings: false,
    });
    return proxy.env;
  })().catch((error: unknown) => {
    state.__devD1Binding = undefined;
    throw error;
  });
  state.__CF_ENV__ = await state.__devD1Binding;
}
