import type { TrainingRecord, LongTermGoal, FrequencyGoal } from '../types';
import { UNCATEGORIZED_LABEL } from '../constants/exercises';

export interface GoalProgress {
  current: number;
  target: number;
  percent: number;
}

function clampPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** その週の月曜日（0時）を返す */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=日, 1=月, ..., 6=土
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** ①長期目標の進捗：指標に応じてrecordsから実績値を算出する */
export function calcLongTermGoalProgress(goal: LongTermGoal, records: TrainingRecord[]): GoalProgress {
  const relevant = records.filter((r) => r.exercise === goal.exercise);
  let current = 0;

  if (goal.metric === 'max_weight') {
    current = relevant.reduce((max, r) => Math.max(max, r.weight), 0);
  } else if (goal.metric === 'total_sets') {
    current = relevant.reduce((sum, r) => sum + r.sets, 0);
  } else if (goal.metric === 'total_reps') {
    current = relevant.reduce((sum, r) => sum + r.reps * r.sets, 0);
  }

  return { current, target: goal.target_value, percent: clampPercent(current, goal.target_value) };
}

/** ②週間目標の進捗：今週（月〜日）にトレーニング記録がある日数をカウントする */
export function calcWeeklyGoalProgress(
  goal: FrequencyGoal,
  records: TrainingRecord[],
  now: Date = new Date()
): GoalProgress {
  const weekStart = getWeekStart(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekStartStr = toDateStr(weekStart);
  const weekEndStr = toDateStr(weekEnd);

  const uniqueDates = new Set(
    records.filter((r) => r.date >= weekStartStr && r.date <= weekEndStr).map((r) => r.date)
  );

  return { current: uniqueDates.size, target: goal.target_count, percent: clampPercent(uniqueDates.size, goal.target_count) };
}

/** ③月間目標の進捗：今月、カテゴリ該当種目の記録がある日数をカウントする */
export function calcMonthlyGoalProgress(
  goal: FrequencyGoal,
  records: TrainingRecord[],
  categoryMap: Record<string, string>,
  now: Date = new Date()
): GoalProgress {
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const uniqueDates = new Set(
    records
      .filter((r) => r.date.startsWith(monthPrefix))
      .filter((r) => (categoryMap[r.exercise] ?? UNCATEGORIZED_LABEL) === goal.category)
      .map((r) => r.date)
  );

  return { current: uniqueDates.size, target: goal.target_count, percent: clampPercent(uniqueDates.size, goal.target_count) };
}
