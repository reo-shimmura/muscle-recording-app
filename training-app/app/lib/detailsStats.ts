import type { TrainingRecord } from '../types';
import { estimateOneRepMax } from './oneRepMax';

export interface DailyStat {
  date: string;
  dailyVolume: number;
  totalVolume: number;
  maxWeight: number;
  estimatedOneRepMax: number;
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
    const oneRepMax = estimateOneRepMax(r.weight, r.reps);
    const existing = statsByDate.get(r.date);

    if (existing) {
      existing.dailyVolume += volume;
      existing.maxWeight = Math.max(existing.maxWeight, r.weight);
      existing.estimatedOneRepMax = Math.max(existing.estimatedOneRepMax, oneRepMax);
      existing.setCount += r.sets;
      existing.durationMinutes += duration;
      existing.maxDurationMinutes = Math.max(existing.maxDurationMinutes, duration);
      existing.sessionCount += 1;
    } else {
      statsByDate.set(r.date, {
        date: r.date,
        dailyVolume: volume,
        maxWeight: r.weight,
        estimatedOneRepMax: oneRepMax,
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

/**
 * グラフの1画面に見せる日数を返す。全期間（1画面に全体を収める）の場合は null。
 * それより前の期間は横にスライドして見る。
 */
export function getRangeDays(range: RangeKey): number | null {
  return range === 'all' ? null : RANGE_DAYS[range];
}