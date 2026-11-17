/**
 * 目標を「横棒1行」で表示するための項目に変換する。ホーム画面と目標管理画面で共通に使う。
 */
import type { BodyWeight, FrequencyGoal, LongTermGoal, ProteinIntake, TrainingRecord } from '../types';
import { calcLongTermGoalProgress, calcMonthlyGoalProgress, calcWeeklyDaysProgress } from './goalsProgress';
import { HABIT_GOAL_KINDS, METRIC_LABELS, type HabitGoalKind } from '../constants/goals';

export interface GoalProgressItem {
  key: string;
  label: string;
  /** 実績 */
  current: number;
  /** 目標。未設定なら null（実績だけ表示する） */
  target: number | null;
  unit: string;
  /** 達成率（%）。目標が未設定なら 0 */
  percent: number;
  /** 元の目標のID（削除などの操作に使う）。習慣で目標が未設定なら null */
  goalId: number | null;
}

export interface HabitSources {
  /** 筋トレの週間目標 */
  weeklyGoal: FrequencyGoal | null;
  /** 習慣目標（プロテイン摂取・体重計の記録） */
  habitGoals: Record<HabitGoalKind, FrequencyGoal | null>;
  records: TrainingRecord[];
  proteinIntakes: ProteinIntake[];
  bodyWeights: BodyWeight[];
}

/** 目標が0以下なら未設定として扱う */
function activeGoal(goal: FrequencyGoal | null): FrequencyGoal | null {
  return goal && goal.target_count > 0 ? goal : null;
}

function weeklyItem(
  key: string,
  label: string,
  unit: string,
  goal: FrequencyGoal | null,
  dates: string[],
  now: Date
): GoalProgressItem {
  const active = activeGoal(goal);
  const progress = calcWeeklyDaysProgress(active?.target_count ?? 0, dates, now);
  return {
    key,
    label,
    unit,
    current: progress.current,
    target: active ? progress.target : null,
    percent: active ? progress.percent : 0,
    goalId: active?.id ?? null,
  };
}

/**
 * 習慣（今週）：筋トレ・プロテイン摂取・体重計の記録の3つを、目標の有無にかかわらず常に返す。
 * 目標が未設定でも、今週の回数（日数）は分かるようにする。
 */
export function buildHabitItems(sources: HabitSources, now: Date = new Date()): GoalProgressItem[] {
  const { weeklyGoal, habitGoals, records, proteinIntakes, bodyWeights } = sources;
  return [
    weeklyItem('training', '筋トレ', '回', weeklyGoal, records.map((r) => r.date), now),
    weeklyItem('protein', HABIT_GOAL_KINDS.protein.label, '日', habitGoals.protein, proteinIntakes.map((p) => p.date), now),
    weeklyItem('bodyWeight', HABIT_GOAL_KINDS.bodyWeight.label, '日', habitGoals.bodyWeight, bodyWeights.map((b) => b.date), now),
  ];
}

/**
 * 長期目標の項目。limit を指定すると、達成率の低い（伸びしろが大きい）順に limit 件に絞る。
 * 指定しなければ、渡された順（新しい順）のまま全件を返す。
 */
export function buildLongTermItems(goals: LongTermGoal[], records: TrainingRecord[], limit?: number): GoalProgressItem[] {
  const items = goals.map((goal): GoalProgressItem => {
    const progress = calcLongTermGoalProgress(goal, records);
    return {
      key: `long-term-${goal.id}`,
      label: `${goal.exercise}（${METRIC_LABELS[goal.metric] ?? goal.metric}）`,
      unit: goal.unit,
      current: progress.current,
      target: progress.target,
      percent: progress.percent,
      goalId: goal.id,
    };
  });
  if (limit === undefined) return items;
  return [...items].sort((a, b) => a.percent - b.percent).slice(0, limit);
}

/** 月間目標（今月）の項目。目標回数が0のカテゴリは含めず、達成率の低い順に並べる */
export function buildMonthlyItems(
  goals: FrequencyGoal[],
  records: TrainingRecord[],
  categoryMap: Record<string, string>,
  now: Date = new Date()
): GoalProgressItem[] {
  return goals
    .filter((goal) => goal.target_count > 0)
    .map((goal): GoalProgressItem => {
      const progress = calcMonthlyGoalProgress(goal, records, categoryMap, now);
      return {
        key: `monthly-${goal.id}`,
        label: goal.category,
        unit: '回',
        current: progress.current,
        target: progress.target,
        percent: progress.percent,
        goalId: goal.id,
      };
    })
    .sort((a, b) => a.percent - b.percent);
}

/** 1つでも目標が設定されているか（習慣で未設定のものは数えない） */
export function hasAnyGoal(items: GoalProgressItem[]): boolean {
  return items.some((item) => item.target !== null);
}
