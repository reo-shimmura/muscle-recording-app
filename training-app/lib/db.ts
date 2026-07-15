import { createClient, type Client } from '@libsql/client';

let db: Client | null = null;

export function getDb(): Client {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL ?? 'file:training.db';
    const authToken = process.env.TURSO_AUTH_TOKEN;
    db = createClient({ url, authToken });
  }
  return db;
}

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = initSchema(getDb());
  }
  return schemaReady;
}

async function initSchema(db: Client): Promise<void> {
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        exercise TEXT NOT NULL,
        weight REAL NOT NULL,
        reps INTEGER NOT NULL,
        sets INTEGER NOT NULL,
        memo TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      )`,
      `CREATE TABLE IF NOT EXISTS progress_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        record_id INTEGER REFERENCES records(id) ON DELETE SET NULL,
        image_path TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      )`,
      `CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      )`,
      `CREATE TABLE IF NOT EXISTS long_term_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exercise TEXT NOT NULL,
        metric TEXT NOT NULL,
        target_value REAL NOT NULL,
        unit TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      )`,
      `CREATE TABLE IF NOT EXISTS frequency_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        period_type TEXT NOT NULL,
        category TEXT,
        target_count INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        UNIQUE(period_type, category)
      )`,
    ],
    'write'
  );
  await migrateAddDurationMinutes(db);
}

// 既存のrecordsテーブルに duration_minutes 列がなければ追加する（有酸素種目を分単位で記録するため）
async function migrateAddDurationMinutes(db: Client): Promise<void> {
  const columns = await db.execute('PRAGMA table_info(records)');
  const hasDurationColumn = columns.rows.some((row) => row.name === 'duration_minutes');
  if (!hasDurationColumn) {
    await db.execute('ALTER TABLE records ADD COLUMN duration_minutes REAL');
  }
}
