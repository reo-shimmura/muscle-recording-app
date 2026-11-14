import type { TrainingRecord } from '../../types';
import { getWeekStart, toDateStr } from '../goalsProgress';
import { parseLocalDate } from '../chartTimeAxis';
import { volumeOf } from './common';

export type PeriodUnit = 'week' | 'month';

export interface PeriodSummary {
  /** 期間の初日（週は月曜、月は1日） */
  start: string;
  /** グラフの横軸用の短いラベル（週: 11/10、月: 11月） */
  label: string;
  /** 記録した日数 */
  days: number;
  /** 負荷量の合計（重量×回数×セット数） */
  volume: number;
  /** セット数の合計（時間で記録した有酸素は除く） */
  sets: number;
}

/** 日付が属する期間の初日を返す */
function periodStartOf(date: Date, unit: PeriodUnit): Date {
  if (unit === 'week') return getWeekStart(date);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** 期間の初日を count 個さかのぼる */
function shiftPeriod(start: Date, unit: PeriodUnit, count: number): Date {
  const d = new Date(start);
  if (unit === 'week') d.setDate(d.getDate() + 7 * count);
  else d.setMonth(d.getMonth() + count);
  return d;
}

function labelOf(start: Date, unit: PeriodUnit): string {
  return unit === 'week' ? `${start.getMonth() + 1}/${start.getDate()}` : `${start.getMonth() + 1}月`;
}

/**
 * 今日を含む直近 count 期間（週 or 月）の集計を、古い順に返す。
 * 記録のない期間も 0 で含める（空いた期間をグラフで読み取れるようにするため）。
 */
export function summarizeByPeriod(
  records: TrainingRecord[],
  unit: PeriodUnit,
  today: string,
  count: number
): PeriodSummary[] {
  const current = periodStartOf(new Date(parseLocalDate(today)), unit);
  const starts = Array.from({ length: count }, (_, i) => shiftPeriod(current, unit, i - (count - 1)));

  const summaries = starts.map((start) => ({
    start: toDateStr(start),
    label: labelOf(start, unit),
    dates: new Set<string>(),
    volume: 0,
    sets: 0,
  }));
  const indexByStart = new Map(summaries.map((s, i) => [s.start, i]));

  for (const r of records) {
    const start = toDateStr(periodStartOf(new Date(parseLocalDate(r.date)), unit));
    const index = indexByStart.get(start);
    if (index === undefined) continue;
    const summary = summaries[index];
    summary.dates.add(r.date);
    summary.volume += volumeOf(r);
    if (r.duration_minutes == null) summary.sets += r.sets;
  }

  return summaries.map(({ dates, ...rest }) => ({ ...rest, days: dates.size }));
}
