import { getDb } from '../db';

export interface TrainingRecord {
  id?: number;
  date: string;
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  memo: string;
  created_at?: string;
}

type RecordInput = Omit<TrainingRecord, 'id' | 'created_at'>;

export const recordsRepository = {
  findAll(): TrainingRecord[] {
    const db = getDb();
    return db.prepare('SELECT * FROM records ORDER BY id DESC').all() as TrainingRecord[];
  },

  findById(id: number): TrainingRecord | null {
    const db = getDb();
    return (db.prepare('SELECT * FROM records WHERE id = ?').get(id) as TrainingRecord) ?? null;
  },

  create(input: RecordInput): TrainingRecord {
    const db = getDb();
    const result = db
      .prepare('INSERT INTO records (date, exercise, weight, reps, sets, memo) VALUES (?, ?, ?, ?, ?, ?)')
      .run(input.date, input.exercise, input.weight, input.reps, input.sets, input.memo);
    return db.prepare('SELECT * FROM records WHERE id = ?').get(result.lastInsertRowid) as TrainingRecord;
  },

  createMany(inputs: RecordInput[]): TrainingRecord[] {
    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO records (date, exercise, weight, reps, sets, memo) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const insertAll = db.transaction((rows: RecordInput[]) => {
      return rows.map((r) => {
        const result = stmt.run(r.date, r.exercise, r.weight, r.reps, r.sets, r.memo);
        return db.prepare('SELECT * FROM records WHERE id = ?').get(result.lastInsertRowid) as TrainingRecord;
      });
    });
    return insertAll(inputs);
  },

  update(id: number, input: Partial<RecordInput>): TrainingRecord | null {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM records WHERE id = ?').get(id) as TrainingRecord | undefined;
    if (!existing) return null;
    const merged = { ...existing, ...input };
    db.prepare(
      'UPDATE records SET date=?, exercise=?, weight=?, reps=?, sets=?, memo=? WHERE id=?'
    ).run(merged.date, merged.exercise, merged.weight, merged.reps, merged.sets, merged.memo, id);
    return db.prepare('SELECT * FROM records WHERE id = ?').get(id) as TrainingRecord;
  },

  delete(id: number): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM records WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
