import type { TrainingRecord } from '../../types';
import { estimateOneRepMax } from '../oneRepMax';
import { categoryOf, diffDaysStr, isStrengthRecord } from './common';

export interface PersonalRecord {
  exercise: string;
  category: string;
  maxWeight: number;
  /** 最大重量に初めて届いた日 */
  maxWeightDate: string;
  bestOneRepMax: number;
  /** 推定1RMの最高値に初めて届いた日 */
  bestOneRepMaxDate: string;
  /** どちらかの自己ベストを直近で更新したか */
  isRecent: boolean;
}

// この日数以内の更新を「最近の更新」として強調する
export const RECENT_PR_DAYS = 14;

/**
 * 種目ごとの自己ベスト（最大重量・推定1RM）を求める。重量0の記録（自重・有酸素）は除く。
 * 同じ値に複数回届いた場合は、最初に届いた日を達成日とする。更新日が新しい順に並べる。
 */
export function calcPersonalRecords(
  records: TrainingRecord[],
  categoryMap: Record<string, string>,
  today: string
): PersonalRecord[] {
  const sorted = records
    .filter((r) => isStrengthRecord(r, categoryMap) && r.weight > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  const bests = new Map<string, Omit<PersonalRecord, 'isRecent'>>();
  for (const r of sorted) {
    const oneRepMax = estimateOneRepMax(r.weight, r.reps);
    const best = bests.get(r.exercise);
    if (!best) {
      bests.set(r.exercise, {
        exercise: r.exercise,
        category: categoryOf(r.exercise, categoryMap),
        maxWeight: r.weight,
        maxWeightDate: r.date,
        bestOneRepMax: oneRepMax,
        bestOneRepMaxDate: r.date,
      });
      continue;
    }
    if (r.weight > best.maxWeight) {
      best.maxWeight = r.weight;
      best.maxWeightDate = r.date;
    }
    if (oneRepMax > best.bestOneRepMax) {
      best.bestOneRepMax = oneRepMax;
      best.bestOneRepMaxDate = r.date;
    }
  }

  const latestOf = (pr: Omit<PersonalRecord, 'isRecent'>) =>
    pr.maxWeightDate > pr.bestOneRepMaxDate ? pr.maxWeightDate : pr.bestOneRepMaxDate;

  return Array.from(bests.values())
    .map((pr) => ({ ...pr, isRecent: diffDaysStr(latestOf(pr), today) < RECENT_PR_DAYS }))
    .sort((a, b) => latestOf(b).localeCompare(latestOf(a)));
}
