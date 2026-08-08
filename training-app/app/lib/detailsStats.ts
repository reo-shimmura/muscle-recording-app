import type { TrainingRecord } from '../types';

export interface DailyStat {
  date: string;
  dailyVolume: number;
  totalVolume: number;
  maxWeight: number;
  setCount: number;
  durationMinutes: number;
  totalDurationMinutes: number;
  maxDurationMinutes: number;
  sessionCount: number;
}

/**
 * 日付ごとに集計する。
 * - 重量トレ種目: 「重量×回数×セット数」の日別・累計ボリュームと最大重量、セット数
 * - 有酸素種目: 日別・累計時間（分）と最大時間（分）、実施回数
 * 日付昇順で返す。累計値（totalVolume, totalDurationMinutes）は渡された記録全体を通した積算値。
 */
export function aggregateDailyStats(records: TrainingRecord[]): DailyStat[] {
  const statsByDate = new Map<string, Omit<DailyStat, 'totalVolume' | 'totalDurationMinutes'>>();

  for (const r of records) {
    const volume = r.weight * r.reps * r.sets;
    const duration = r.duration_minutes ?? 0;
    const existing = statsByDate.get(r.date);

    if (existing) {
      existing.dailyVolume += volume;
      existing.maxWeight = Math.max(existing.maxWeight, r.weight);
      existing.setCount += r.sets;
      existing.durationMinutes += duration;
      existing.maxDurationMinutes = Math.max(existing.maxDurationMinutes, duration);
      existing.sessionCount += 1;
    } else {
      statsByDate.set(r.date, {
        date: r.date,
        dailyVolume: volume,
        maxWeight: r.weight,
        setCount: r.sets,
        durationMinutes: duration,
        maxDurationMinutes: duration,
        sessionCount: 1,
      });
    }
  }

  const sorted = Array.from(statsByDate.values()).sort((a, b) => a.date.localeCompare(b.date));

  let cumulativeVolume = 0;
  let cumulativeDuration = 0;
  return sorted.map((s) => {
    cumulativeVolume += s.dailyVolume;
    cumulativeDuration += s.durationMinutes;
    return { ...s, totalVolume: cumulativeVolume, totalDurationMinutes: cumulativeDuration };
  });
}

export type RangeKey = '1w' | '2w' | '1m' | '3m' | 'all';

const RANGE_DAYS: Record<Exclude<RangeKey, 'all'>, number> = {
  '1w': 7,
  '2w': 14,
  '1m': 30,
  '3m': 90,
};

/** 累計値は保持したまま、指定した表示範囲（直近N日 or 全期間）にトリミングする */
export function filterStatsByRange(stats: DailyStat[], range: RangeKey): DailyStat[] {
  if (range === 'all') return stats;
  const days = RANGE_DAYS[range];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cutoffDate = cutoff.toISOString().slice(0, 10);
  return stats.filter((s) => s.date >= cutoffDate);
}