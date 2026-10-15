import type { TrainingRecord } from '../types';

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 連続記録日数を算出する（種目を問わず、記録がある日をカウント）。
 * 今日の記録がまだなければ前日から数え、今日の記録があれば今日から数える。
 * 前日も今日も記録がなければ 0。
 */
export function calcCurrentStreak(records: TrainingRecord[], now: Date = new Date()): number {
  const recordedDates = new Set(records.map((r) => r.date));

  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  if (!recordedDates.has(toDateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!recordedDates.has(toDateStr(cursor))) return 0;
  }

  let streak = 0;
  while (recordedDates.has(toDateStr(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
