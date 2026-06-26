import { getDb } from '../db';

export interface ProgressImage {
  id?: number;
  date: string;
  record_id?: number | null;
  image_path: string;
  created_at?: string;
}

type ImageInput = Omit<ProgressImage, 'id' | 'created_at'>;

export const imagesRepository = {
  findAll(): ProgressImage[] {
    const db = getDb();
    return db.prepare('SELECT * FROM progress_images ORDER BY date DESC').all() as ProgressImage[];
  },

  create(input: ImageInput): ProgressImage {
    const db = getDb();
    const result = db
      .prepare('INSERT INTO progress_images (date, record_id, image_path) VALUES (?, ?, ?)')
      .run(input.date, input.record_id ?? null, input.image_path);
    return db.prepare('SELECT * FROM progress_images WHERE id = ?').get(result.lastInsertRowid) as ProgressImage;
  },
};
