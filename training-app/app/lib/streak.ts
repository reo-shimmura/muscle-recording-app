import type { TrainingRecord, FrequencyGoal } from '../types';
import { getWeekStart, toDateStr } from './goalsProgress';

/** 指定した週（月〜日）に記録がある日数を数える */
function countRecordedDaysInWeek(recordedDates: Set<string>, weekStart: Date): number {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const startStr = toDateStr(weekStart);
  const endStr = toDateStr(weekEnd);

  let count = 0;
  for (const date of recordedDates) {
    if (date >= startStr && date <= endStr) count += 1;
  }
  return count;
}

/**
 * 週間目標を達成した週が何週連続しているかを算出する。
 * 今週はまだ終わっていないため、今週分がまだ未達成でも連続記録は途切れさせず、
 * 直前に完了した週（先週）から遡って判定する。今週が既に達成済みならそこから数える。
 * 週間目標が未設定、または先週も今週も未達成の場合は 0。
 */
export function calcWeeklyGoalStreak(
  weeklyGoal: FrequencyGoal | null,
  records: TrainingRecord[],
  now: Date = new Date()
): number {
  if (!weeklyGoal || weeklyGoal.target_count <= 0) return 0;

  const recordedDates = new Set(records.map((r) => r.date));
  const isAchieved = (weekStart: Date) =>
    countRecordedDaysInWeek(recordedDates, weekStart) >= weeklyGoal.target_count;

  const cursor = getWeekStart(now);
  if (!isAchieved(cursor)) {
    cursor.setDate(cursor.getDate() - 7);
    if (!isAchieved(cursor)) return 0;
  }

  let streak = 0;
  while (isAchieved(cursor)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}
