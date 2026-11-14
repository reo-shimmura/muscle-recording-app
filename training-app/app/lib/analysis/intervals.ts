import type { TrainingRecord } from '../../types';
import { diffDaysStr } from './common';

export interface IntervalBucket {
  label: string;
  count: number;
}

// 分布の区切り。1〜7日は1日ずつ、それ以上はまとめる
const BUCKETS: { label: string; min: number; max: number }[] = [
  ...[1, 2, 3, 4, 5, 6, 7].map((d) => ({ label: `${d}日`, min: d, max: d })),
  { label: '8〜13日', min: 8, max: 13 },
  { label: '14日以上', min: 14, max: Infinity },
];

/** 記録した日どうしの間隔（日数）を、古い順に返す。同じ日の複数記録は1日として扱う */
export function calcIntervals(records: TrainingRecord[]): number[] {
  const dates = Array.from(new Set(records.map((r) => r.date))).sort();
  return dates.slice(1).map((date, i) => diffDaysStr(dates[i], date));
}

/** 間隔の分布を区切りごとに数える */
export function bucketIntervals(intervals: number[]): IntervalBucket[] {
  return BUCKETS.map(({ label, min, max }) => ({
    label,
    count: intervals.filter((gap) => gap >= min && gap <= max).length,
  }));
}

/** 間隔の平均と中央値（小数第1位まで）。間隔がなければ null */
export function summarizeIntervals(intervals: number[]): { average: number | null; median: number | null } {
  if (intervals.length === 0) return { average: null, median: null };
  const sorted = [...intervals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  const average = intervals.reduce((sum, v) => sum + v, 0) / intervals.length;
  return { average: Math.round(average * 10) / 10, median };
}
