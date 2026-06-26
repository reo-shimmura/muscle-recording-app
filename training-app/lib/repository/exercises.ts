import { getDb } from '../db';
import type { CustomExercise } from '../../app/types';

export const exercisesRepository = {
  findAll(): CustomExercise[] {
    const db = getDb();
    return db.prepare('SELECT id, name, category FROM exercises ORDER BY category, name').all() as CustomExercise[];
  },

  /** 種目を保存（同名の場合はカテゴリを更新） */
  upsert(name: string, category: string): CustomExercise {
    const db = getDb();
    db.prepare(`
      INSERT INTO exercises (name, category)
      VALUES (?, ?)
      ON CONFLICT(name) DO UPDATE SET category = excluded.category
    `).run(name, category);
    return db.prepare('SELECT id, name, category FROM exercises WHERE name = ?').get(name) as CustomExercise;
  },
};
