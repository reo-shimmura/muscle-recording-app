import { getDb, ensureSchema } from '../db';

export interface BodyWeight {
  id: number;
  date: string;
  weight_kg: number;
  created_at?: string;
}

export const bodyWeightsRepository = {
  async findAll(): Promise<BodyWeight[]> {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute('SELECT * FROM body_weights ORDER BY date ASC');
    return result.rows as unknown as BodyWeight[];
  },

  /** 同じ日付の記録があれば体重を上書きする */
  async upsert(date: string, weightKg: number): Promise<BodyWeight> {
    await ensureSchema();
    const db = getDb();
    await db.execute({
      sql: `
        INSERT INTO body_weights (date, weight_kg)
        VALUES (?, ?)
        ON CONFLICT(date) DO UPDATE SET weight_kg = excluded.weight_kg
      `,
      args: [date, weightKg],
    });
    const row = await db.execute({
      sql: 'SELECT * FROM body_weights WHERE date = ?',
      args: [date],
    });
    return row.rows[0] as unknown as BodyWeight;
  },

  async delete(id: number): Promise<boolean> {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute({ sql: 'DELETE FROM body_weights WHERE id = ?', args: [id] });
    return result.rowsAffected > 0;
  },
};
