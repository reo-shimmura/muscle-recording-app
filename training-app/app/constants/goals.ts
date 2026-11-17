import type { GoalMetric } from '../types';

export interface MetricOption {
  value: GoalMetric;
  label: string;
  unit: string;
}

/** 長期目標の指標（筋トレの種目） */
export const STRENGTH_METRIC_OPTIONS: MetricOption[] = [
  { value: 'max_weight', label: '最大重量', unit: 'kg' },
  { value: 'total_sets', label: '累計セット数', unit: 'セット' },
  { value: 'total_reps', label: '累計回数', unit: '回' },
];

/** 長期目標の指標（ランニングなど有酸素の種目） */
export const CARDIO_METRIC_OPTIONS: MetricOption[] = [
  { value: 'total_distance', label: '累計距離', unit: 'km' },
  { value: 'total_duration', label: '累計時間', unit: '分' },
];

/** 指標の表示名（一覧などで使う） */
export const METRIC_LABELS: Record<GoalMetric, string> = Object.fromEntries(
  [...STRENGTH_METRIC_OPTIONS, ...CARDIO_METRIC_OPTIONS].map((m) => [m.value, m.label])
) as Record<GoalMetric, string>;

/** 週間目標のうち、筋トレ全体の回数を表すカテゴリ（DBでは空文字で保存している） */
export const OVERALL_WEEKLY_CATEGORY = '';

/**
 * 習慣目標（週に何日記録するか）の種類。
 * 週間目標と同じ仕組み（頻度目標）に、このカテゴリ名で保存する。
 */
export const HABIT_GOAL_KINDS = {
  protein: { category: 'プロテイン', label: 'プロテイン摂取' },
  bodyWeight: { category: '体重計', label: '体重計の記録' },
} as const;

export type HabitGoalKind = keyof typeof HABIT_GOAL_KINDS;
