import { getDb, ensureSchema } from '../db';

export interface ProgressImage {
  id?: number;
  date: string;
  record_id?: number | null;
  image_path: string;
  created_at?: string;
}

type ImageInput = Omit<ProgressImage, 'id' | 'created_at'>;

export const imagesRepository = {
  async findAll(): Promise<ProgressImage[]> {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute('SELECT * FROM progress_images ORDER BY date DESC');
    return result.rows as unknown as ProgressImage[];
  },

  async create(input: ImageInput): Promise<ProgressImage> {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute({
      sql: 'INSERT INTO progress_images (date, record_id, image_path) VALUES (?, ?, ?)',
      args: [input.date, input.record_id ?? null, input.image_path],
    });
    const row = await db.execute({
      sql: 'SELECT * FROM progress_images WHERE id = ?',
      args: [Number(result.lastInsertRowid)],
    });
    return row.rows[0] as unknown as ProgressImage;
  },
};
