import { getDb, ensureSchema } from '../db';

export interface ProteinIntake {
  id: number;
  date: string;
  amount_g: number;
  created_at?: string;
}

export const proteinIntakesRepository = {
  /** 日付の古い順（同じ日付は登録順）に全件を返す */
  async findAll(): Promise<ProteinIntake[]> {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute('SELECT * FROM protein_intakes ORDER BY date ASC, id ASC');
    return result.rows as unknown as ProteinIntake[];
  },

  async create(date: string, amountG: number): Promise<ProteinIntake> {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute({
      sql: 'INSERT INTO protein_intakes (date, amount_g) VALUES (?, ?)',
      args: [date, amountG],
    });
    const row = await db.execute({
      sql: 'SELECT * FROM protein_intakes WHERE id = ?',
      args: [Number(result.lastInsertRowid)],
    });
    return row.rows[0] as unknown as ProteinIntake;
  },

  async delete(id: number): Promise<boolean> {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute({ sql: 'DELETE FROM protein_intakes WHERE id = ?', args: [id] });
    return result.rowsAffected > 0;
  },
};
