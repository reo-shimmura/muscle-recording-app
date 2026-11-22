import { getDb, ensureSchema } from '../db';

export interface FoodIntake {
  id: number;
  date: string;
  food_key: string;
  /** 量（食品の単位。プロテインは粉のg、卵は個、肉はg） */
  quantity: number;
  /** 保存時に計算したたんぱく質（g） */
  protein_g: number;
  created_at?: string;
}

type FoodIntakeInput = Omit<FoodIntake, 'id' | 'created_at'>;

export const foodIntakesRepository = {
  /** 日付の古い順（同じ日付は登録順）に全件を返す */
  async findAll(): Promise<FoodIntake[]> {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute('SELECT * FROM food_intakes ORDER BY date ASC, id ASC');
    return result.rows as unknown as FoodIntake[];
  },

  async create(input: FoodIntakeInput): Promise<FoodIntake> {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute({
      sql: 'INSERT INTO food_intakes (date, food_key, quantity, protein_g) VALUES (?, ?, ?, ?)',
      args: [input.date, input.food_key, input.quantity, input.protein_g],
    });
    const row = await db.execute({
      sql: 'SELECT * FROM food_intakes WHERE id = ?',
      args: [Number(result.lastInsertRowid)],
    });
    return row.rows[0] as unknown as FoodIntake;
  },

  async delete(id: number): Promise<boolean> {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute({ sql: 'DELETE FROM food_intakes WHERE id = ?', args: [id] });
    return result.rowsAffected > 0;
  },
};
