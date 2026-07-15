import { getDb, ensureSchema } from '../db';

export type GoalMetric = 'max_weight' | 'total_sets' | 'total_reps';
export type PeriodType = 'week' | 'month';

export interface LongTermGoal {
  id: number;
  exercise: string;
  metric: GoalMetric;
  target_value: number;
  unit: string;
  created_at?: string;
}

// SQLiteのUNIQUE制約はNULL同士を別物として扱いON CONFLICTが効かないため、
// 週間目標(全体)は category='' で表す
export const OVERALL_CATEGORY = '';

export interface FrequencyGoal {
  id: number;
  period_type: PeriodType;
  category: string;
  target_count: number;
  created_at?: string;
}

type LongTermGoalInput = Omit<LongTermGoal, 'id' | 'created_at'>;
type FrequencyGoalInput = Omit<FrequencyGoal, 'id' | 'created_at'>;

export const longTermGoalsRepository = {
  async findAll(): Promise<LongTermGoal[]> {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute('SELECT * FROM long_term_goals ORDER BY id DESC');
    return result.rows as unknown as LongTermGoal[];
  },

  async create(input: LongTermGoalInput): Promise<LongTermGoal> {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute({
      sql: 'INSERT INTO long_term_goals (exercise, metric, target_value, unit) VALUES (?, ?, ?, ?)',
      args: [input.exercise, input.metric, input.target_value, input.unit],
    });
    const row = await db.execute({
      sql: 'SELECT * FROM long_term_goals WHERE id = ?',
      args: [Number(result.lastInsertRowid)],
    });
    return row.rows[0] as unknown as LongTermGoal;
  },

  async delete(id: number): Promise<boolean> {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute({ sql: 'DELETE FROM long_term_goals WHERE id = ?', args: [id] });
    return result.rowsAffected > 0;
  },
};

export const frequencyGoalsRepository = {
  async findByPeriod(periodType: PeriodType): Promise<FrequencyGoal[]> {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute({
      sql: 'SELECT * FROM frequency_goals WHERE period_type = ?',
      args: [periodType],
    });
    return result.rows as unknown as FrequencyGoal[];
  },

  /** 同一 (period_type, category) のレコードがあれば置き換え、なければ作成する */
  async upsertMany(periodType: PeriodType, items: Omit<FrequencyGoalInput, 'period_type'>[]): Promise<FrequencyGoal[]> {
    await ensureSchema();
    const db = getDb();
    for (const item of items) {
      await db.execute({
        sql: `INSERT INTO frequency_goals (period_type, category, target_count) VALUES (?, ?, ?)
              ON CONFLICT(period_type, category) DO UPDATE SET target_count = excluded.target_count`,
        args: [periodType, item.category, item.target_count],
      });
    }
    return frequencyGoalsRepository.findByPeriod(periodType);
  },
};
