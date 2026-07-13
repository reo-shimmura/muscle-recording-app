import type { TrainingRecord } from '../types';

export interface DailyStat {
  date: string;
  volume: number;
  maxWeight: number;
  durationMinutes: number;
  maxDurationMinutes: number;
}

/**
 * 日付ごとに集計する。
 * - 重量トレ種目: 「重量×回数×セット数」の合計ボリュームと最大重量
 * - 有酸素種目: 合計時間（分）と最大時間（分）
 * 日付昇順で返す。
 */
export function aggregateDailyStats(records: TrainingRecord[]): DailyStat[] {
  const statsByDate = new Map<string, DailyStat>();

  for (const r of records) {
    const volume = r.weight * r.reps * r.sets;
    const duration = r.duration_minutes ?? 0;
    const existing = statsByDate.get(r.date);

    if (existing) {
      existing.volume += volume;
      existing.maxWeight = Math.max(existing.maxWeight, r.weight);
      existing.durationMinutes += duration;
      existing.maxDurationMinutes = Math.max(existing.maxDurationMinutes, duration);
    } else {
      statsByDate.set(r.date, {
        date: r.date,
        volume,
        maxWeight: r.weight,
        durationMinutes: duration,
        maxDurationMinutes: duration,
      });
    }
  }

  return Array.from(statsByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
