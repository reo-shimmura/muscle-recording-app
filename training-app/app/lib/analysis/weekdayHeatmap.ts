import type { TrainingRecord } from '../../types';
import { getWeekStart, toDateStr } from '../goalsProgress';
import { parseLocalDate } from '../chartTimeAxis';
import { addDaysStr, volumeOf } from './common';

export type HeatLevel = 0 | 1 | 2 | 3 | 4;

export interface HeatCell {
  date: string;
  volume: number;
  /** 0: 記録なし、1〜4: 記録あり（負荷量が多いほど濃い） */
  level: HeatLevel;
  /** 今日より後の日（まだ来ていない日） */
  future: boolean;
}

/** 曜日の表示順（月曜始まり） */
export const WEEKDAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

/** 負荷量を、期間内の最大値に対する割合で 1〜4 の濃さにする（有酸素のみの日は 1） */
function toLevel(volume: number, maxVolume: number): HeatLevel {
  if (maxVolume <= 0 || volume <= 0) return 1;
  return Math.min(4, Math.max(1, Math.ceil((volume / maxVolume) * 4))) as HeatLevel;
}

/**
 * 直近 weeks 週分のマスを、週（列）×曜日（行・月曜始まり）の2次元配列で返す。
 * 列は古い週から順に並べ、最後の列が今週。
 */
export function buildWeekdayHeatmap(records: TrainingRecord[], today: string, weeks: number): HeatCell[][] {
  const volumeByDate = new Map<string, number>();
  for (const r of records) {
    volumeByDate.set(r.date, (volumeByDate.get(r.date) ?? 0) + volumeOf(r));
  }

  const firstMonday = addDaysStr(toDateStr(getWeekStart(new Date(parseLocalDate(today)))), -7 * (weeks - 1));
  const lastDay = addDaysStr(firstMonday, weeks * 7 - 1);
  const maxVolume = Math.max(
    0,
    ...Array.from(volumeByDate.entries())
      .filter(([date]) => date >= firstMonday && date <= lastDay)
      .map(([, v]) => v)
  );

  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDaysStr(firstMonday, w * 7 + d);
      const volume = volumeByDate.get(date);
      return {
        date,
        volume: volume ?? 0,
        level: volume === undefined ? 0 : toLevel(volume, maxVolume),
        future: date > today,
      };
    })
  );
}

/** 曜日ごとに、記録した日の数を数える（月曜始まりの7要素） */
export function countByWeekday(records: TrainingRecord[]): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const date of new Set(records.map((r) => r.date))) {
    const day = new Date(parseLocalDate(date)).getDay(); // 0=日
    counts[(day + 6) % 7] += 1;
  }
  return counts;
}
