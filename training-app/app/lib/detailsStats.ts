import type { TrainingRecord } from '../types';

export interface DailyStat {
  date: string;
  volume: number;
  maxWeight: number;
}

/** 日付ごとに「重量×回数×セット数」の合計ボリュームと最大重量を集計し、日付昇順で返す */
export function aggregateDailyStats(records: TrainingRecord[]): DailyStat[] {
  const statsByDate = new Map<string, DailyStat>();

  for (const r of records) {
    const volume = r.weight * r.reps * r.sets;
    const existing = statsByDate.get(r.date);

    if (existing) {
      existing.volume += volume;
      existing.maxWeight = Math.max(existing.maxWeight, r.weight);
    } else {
      statsByDate.set(r.date, { date: r.date, volume, maxWeight: r.weight });
    }
  }

  return Array.from(statsByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
