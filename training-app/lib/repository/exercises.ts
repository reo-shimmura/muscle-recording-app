import { getDb, ensureSchema } from '../db';
import type { CustomExercise } from '../../app/types';

export const exercisesRepository = {
  async findAll(): Promise<CustomExercise[]> {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute('SELECT id, name, category FROM exercises ORDER BY category, name');
    return result.rows as unknown as CustomExercise[];
  },

  /** 種目を保存（同名の場合はカテゴリを更新） */
  async upsert(name: string, category: string): Promise<CustomExercise> {
    await ensureSchema();
    const db = getDb();
    await db.execute({
      sql: `
        INSERT INTO exercises (name, category)
        VALUES (?, ?)
        ON CONFLICT(name) DO UPDATE SET category = excluded.category
      `,
      args: [name, category],
    });
    const row = await db.execute({
      sql: 'SELECT id, name, category FROM exercises WHERE name = ?',
      args: [name],
    });
    return row.rows[0] as unknown as CustomExercise;
  },
};
