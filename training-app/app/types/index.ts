export interface TrainingRecord {
  id?: number;
  date: string;
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  duration_minutes?: number | null;
  memo: string;
}

export type GoalMetric = 'max_weight' | 'total_sets' | 'total_reps';
export type PeriodType = 'week' | 'month';

/** ①長期目標：種目ごとの数値目標（例: ベンチプレス 最大重量60kg） */
export interface LongTermGoal {
  id: number;
  exercise: string;
  metric: GoalMetric;
  target_value: number;
  unit: string;
}

/** ②週間目標・③月間目標：期間内のトレーニング実施回数目標
 *  category === '' の場合は「全体」（週間目標で使用）
 */
export interface FrequencyGoal {
  id: number;
  period_type: PeriodType;
  category: string;
  target_count: number;
}

export interface ProgressImage {
  id?: number;
  date: string;
  image_path: string;
  record_id?: number | null;
  created_at?: string;
}

export interface WorkoutSetItem {
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
}

export interface WorkoutSetTemplate {
  id: string;
  name: string;
  items: WorkoutSetItem[];
}

export interface CustomExercise {
  id: number;
  name: string;
  category: string;
}

export type AlertType = 'error' | 'success' | 'info';

export interface AlertMessage {
  type: AlertType;
  text: string;
}
