import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);

// Cloudflare Builds has no local env files. Only public deployment settings
// belong in Git; AUTH_SECRET and CONFIG_ENCRYPTION_KEY stay in Worker Secrets.
if (existsSync('.env.production')) loadEnvFile('.env.production');
const config = JSON.parse(readFileSync('deploy/cloudflare.json', 'utf8'));
config.$schema = 'node_modules/wrangler/config-schema.json';
writeFileSync('wrangler.jsonc', `${JSON.stringify(config, null, 2)}\n`);

// These settings must win over local development files in both client and SSR.
const env = {
  ...process.env,
  ...config.vars,
  NODE_ENV: 'production',
  NITRO_PRESET: 'cloudflare_module',
};

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(process.execPath, ['scripts/db-setup.mjs']);
run('pnpm', ['exec', 'vite', 'build']);

if (!process.argv.includes('--build-only')) {
  // Nitro's .wrangler/deploy/config.json points to the generated Worker entry.
  run('pnpm', ['exec', 'wrangler', 'deploy']);
}
