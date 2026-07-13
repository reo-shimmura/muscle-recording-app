import { getDb, ensureSchema } from '../db';

export interface TrainingRecord {
  id?: number;
  date: string;
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  duration_minutes?: number | null;
  memo: string;
  created_at?: string;
}

type RecordInput = Omit<TrainingRecord, 'id' | 'created_at'>;

export const recordsRepository = {
  async findAll(): Promise<TrainingRecord[]> {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute('SELECT * FROM records ORDER BY id DESC');
    return result.rows as unknown as TrainingRecord[];
  },

  async findById(id: number): Promise<TrainingRecord | null> {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute({ sql: 'SELECT * FROM records WHERE id = ?', args: [id] });
    return (result.rows[0] as unknown as TrainingRecord) ?? null;
  },

  async create(input: RecordInput): Promise<TrainingRecord> {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute({
      sql: 'INSERT INTO records (date, exercise, weight, reps, sets, duration_minutes, memo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [input.date, input.exercise, input.weight, input.reps, input.sets, input.duration_minutes ?? null, input.memo],
    });
    const row = await db.execute({
      sql: 'SELECT * FROM records WHERE id = ?',
      args: [Number(result.lastInsertRowid)],
    });
    return row.rows[0] as unknown as TrainingRecord;
  },

  async createMany(inputs: RecordInput[]): Promise<TrainingRecord[]> {
    await ensureSchema();
    const db = getDb();
    const created: TrainingRecord[] = [];
    for (const r of inputs) {
      const result = await db.execute({
        sql: 'INSERT INTO records (date, exercise, weight, reps, sets, duration_minutes, memo) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [r.date, r.exercise, r.weight, r.reps, r.sets, r.duration_minutes ?? null, r.memo],
      });
      const row = await db.execute({
        sql: 'SELECT * FROM records WHERE id = ?',
        args: [Number(result.lastInsertRowid)],
      });
      created.push(row.rows[0] as unknown as TrainingRecord);
    }
    return created;
  },

  async update(id: number, input: Partial<RecordInput>): Promise<TrainingRecord | null> {
    await ensureSchema();
    const db = getDb();
    const existingResult = await db.execute({ sql: 'SELECT * FROM records WHERE id = ?', args: [id] });
    const existing = existingResult.rows[0] as unknown as TrainingRecord | undefined;
    if (!existing) return null;
    const merged = { ...existing, ...input };
    await db.execute({
      sql: 'UPDATE records SET date=?, exercise=?, weight=?, reps=?, sets=?, duration_minutes=?, memo=? WHERE id=?',
      args: [merged.date, merged.exercise, merged.weight, merged.reps, merged.sets, merged.duration_minutes ?? null, merged.memo, id],
    });
    const row = await db.execute({ sql: 'SELECT * FROM records WHERE id = ?', args: [id] });
    return row.rows[0] as unknown as TrainingRecord;
  },

  async delete(id: number): Promise<boolean> {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute({ sql: 'DELETE FROM records WHERE id = ?', args: [id] });
    return result.rowsAffected > 0;
  },
};
