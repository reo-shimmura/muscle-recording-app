import type { TrainingRecord } from '../../types';
import { categoryOf, diffDaysStr } from './common';

export interface LastTrained {
  category: string;
  /** 最後に記録した日。一度も記録がなければ null */
  lastDate: string | null;
  /** 今日から見て何日前か。一度も記録がなければ null */
  daysAgo: number | null;
}

/**
 * 部位（カテゴリ）ごとに最後に鍛えた日を求める。
 * 空いている順に並べ、一度もやっていない部位は先頭に置く（次に鍛える候補を上に出すため）。
 */
export function calcLastTrainedByCategory(
  records: TrainingRecord[],
  categoryMap: Record<string, string>,
  categories: string[],
  today: string
): LastTrained[] {
  const lastDates = new Map<string, string>();
  for (const r of records) {
    const category = categoryOf(r.exercise, categoryMap);
    const prev = lastDates.get(category);
    if (!prev || r.date > prev) lastDates.set(category, r.date);
  }

  const result = categories.map((category): LastTrained => {
    const lastDate = lastDates.get(category) ?? null;
    return { category, lastDate, daysAgo: lastDate ? Math.max(0, diffDaysStr(lastDate, today)) : null };
  });

  return result.sort((a, b) => (b.daysAgo ?? Infinity) - (a.daysAgo ?? Infinity));
}
