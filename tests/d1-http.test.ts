import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';

// Explicit opt-in: exercises a disposable table in the configured remote D1.
// No application rows are read or changed; the table is removed in finally.
test(
  'D1 HTTP preserves raw columns, batch rollback and concurrent guards',
  {
    skip: process.env.D1_HTTP_INTEGRATION !== '1',
  },
  async () => {
    const { unstable_readConfig } = await import('wrangler');
    const { createD1HttpBinding } = await import('../src/core/db/d1-dev');
    const config = unstable_readConfig({ config: 'wrangler.jsonc' });
    const binding = config.d1_databases.find(
      (db: { binding: string }) => db.binding === 'DB'
    );
    assert.ok(binding?.database_id && config.account_id);
    const db = createD1HttpBinding(config.account_id, binding.database_id);
    const table = `__connection_test_${randomUUID().replaceAll('-', '')}`;
    await db
      .prepare(
        `CREATE TABLE ${table} (id TEXT PRIMARY KEY, value INTEGER NOT NULL CHECK(value >= 0))`
      )
      .run();
    try {
      assert.deepEqual(
        await db.prepare('SELECT ? AS first, ? AS first').bind('a', 'b').raw(),
        [['a', 'b']]
      );
      await assert.rejects(
        db.batch([
          db.prepare(`INSERT INTO ${table} VALUES (?, ?)`).bind('rollback', 1),
          db.prepare(`INSERT INTO ${table} VALUES (?, ?)`).bind('rollback', 2),
        ])
      );
      assert.equal(
        await db
          .prepare(`SELECT COUNT(*) AS count FROM ${table}`)
          .first('count'),
        0
      );
      await db
        .prepare(`INSERT INTO ${table} VALUES (?, ?)`)
        .bind('counter', 1)
        .run();
      const claims = await Promise.allSettled(
        [0, 1].map(() =>
          db.batch([
            db
              .prepare(`UPDATE ${table} SET value = value - 1 WHERE id = ?`)
              .bind('counter'),
            db
              .prepare(`SELECT value FROM ${table} WHERE id = ?`)
              .bind('counter'),
          ])
        )
      );
      assert.equal(
        claims.filter((claim) => claim.status === 'fulfilled').length,
        1
      );
      assert.equal(
        await db
          .prepare(`SELECT value FROM ${table} WHERE id = ?`)
          .bind('counter')
          .first('value'),
        0
      );
    } finally {
      await db.prepare(`DROP TABLE ${table}`).run();
    }
  }
);
