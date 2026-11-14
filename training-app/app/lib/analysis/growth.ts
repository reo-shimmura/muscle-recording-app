import type { TrainingRecord } from '../../types';
import { estimateOneRepMax } from '../oneRepMax';
import { addDaysStr, changeRate, isStrengthRecord } from './common';

export interface Growth {
  exercise: string;
  /** 直近の期間より前の推定1RMのベスト */
  past: number;
  /** 直近の期間の推定1RMのベスト */
  recent: number;
  /** 伸び率（%） */
  rate: number;
}

/**
 * 種目ごとに、直近 days 日の推定1RMのベストを、それより前のベストと比べた伸び率を求める。
 * 全期間の自己ベスト同士だと下がっても 0% に張り付くため、「直近」と「それ以前」で比べる。
 * 両方の期間に記録がある種目だけを対象にし、伸び率の高い順に並べる。
 */
export function calcGrowth(
  records: TrainingRecord[],
  categoryMap: Record<string, string>,
  today: string,
  days: number
): Growth[] {
  const recentStart = addDaysStr(today, -(days - 1));
  const pastBest = new Map<string, number>();
  const recentBest = new Map<string, number>();

  for (const r of records) {
    if (!isStrengthRecord(r, categoryMap) || r.weight <= 0 || r.date > today) continue;
    const target = r.date >= recentStart ? recentBest : pastBest;
    target.set(r.exercise, Math.max(target.get(r.exercise) ?? 0, estimateOneRepMax(r.weight, r.reps)));
  }

  const result: Growth[] = [];
  for (const [exercise, recent] of recentBest) {
    const past = pastBest.get(exercise);
    const rate = past === undefined ? null : changeRate(recent, past);
    if (past !== undefined && rate !== null) result.push({ exercise, past, recent, rate });
  }
  return result.sort((a, b) => b.rate - a.rate);
}
