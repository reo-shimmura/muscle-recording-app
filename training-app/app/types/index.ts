export interface TrainingRecord {
  id?: number;
  date: string;
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  duration_minutes?: number | null;
  /** 有酸素種目の距離（km）。任意 */
  distance_km?: number | null;
  memo: string;
}

// 筋トレ：最大重量・累計セット数・累計回数 ／ 有酸素：累計距離(km)・累計時間(分)
export type GoalMetric = 'max_weight' | 'total_sets' | 'total_reps' | 'total_distance' | 'total_duration';
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

export interface BodyWeight {
  id: number;
  date: string;
  weight_kg: number;
}

/** たんぱく質の摂取記録（プロテイン・卵・肉などの1回分） */
export interface FoodIntake {
  id: number;
  date: string;
  /** 食品の種類（app/constants/foods.ts の key） */
  food_key: string;
  /** 量（食品の単位。プロテインは粉のg、卵は個、肉はg） */
  quantity: number;
  /** 保存時に計算したたんぱく質（g） */
  protein_g: number;
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
