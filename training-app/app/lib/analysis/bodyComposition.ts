import type { BodyWeight, TrainingRecord } from '../../types';
import { getWeekStart, toDateStr } from '../goalsProgress';
import { parseLocalDate } from '../chartTimeAxis';
import { summarizeByPeriod } from './periodSummary';
import type { PersonalRecord } from './personalRecords';

export interface WeeklyBodyStat {
  start: string;
  label: string;
  /** その週の負荷量の合計 */
  volume: number;
  /** その週の平均体重（記録がなければ null） */
  bodyWeight: number | null;
}

export interface RelativeStrength {
  exercise: string;
  oneRepMax: number;
  /** 推定1RM ÷ 体重（小数第2位まで） */
  ratio: number;
}

export interface RelativeStrengthResult {
  /** 基準にした体重（最新の記録） */
  bodyWeight: number;
  bodyWeightDate: string;
  items: RelativeStrength[];
}

/** 直近 weeks 週の負荷量と平均体重を、古い週から順に返す */
export function summarizeWeeklyBody(
  records: TrainingRecord[],
  bodyWeights: BodyWeight[],
  today: string,
  weeks: number
): WeeklyBodyStat[] {
  const weightsByWeek = new Map<string, number[]>();
  for (const bw of bodyWeights) {
    const start = toDateStr(getWeekStart(new Date(parseLocalDate(bw.date))));
    weightsByWeek.set(start, [...(weightsByWeek.get(start) ?? []), bw.weight_kg]);
  }

  return summarizeByPeriod(records, 'week', today, weeks).map(({ start, label, volume }) => {
    const weights = weightsByWeek.get(start);
    const bodyWeight = weights
      ? Math.round((weights.reduce((sum, w) => sum + w, 0) / weights.length) * 10) / 10
      : null;
    return { start, label, volume, bodyWeight };
  });
}

/** 最新の体重の記録を返す（なければ null） */
export function latestBodyWeight(bodyWeights: BodyWeight[]): BodyWeight | null {
  return bodyWeights.reduce<BodyWeight | null>(
    (latest, bw) => (latest === null || bw.date > latest.date ? bw : latest),
    null
  );
}

/**
 * 種目ごとの推定1RMの自己ベストを、最新の体重で割った倍率を求める（倍率の高い順）。
 * 体重の記録がない場合は null。
 */
export function calcRelativeStrength(
  personalRecords: PersonalRecord[],
  bodyWeights: BodyWeight[]
): RelativeStrengthResult | null {
  const latest = latestBodyWeight(bodyWeights);
  if (!latest || latest.weight_kg <= 0) return null;

  const items = personalRecords
    .map((pr) => ({
      exercise: pr.exercise,
      oneRepMax: pr.bestOneRepMax,
      ratio: Math.round((pr.bestOneRepMax / latest.weight_kg) * 100) / 100,
    }))
    .sort((a, b) => b.ratio - a.ratio);

  return { bodyWeight: latest.weight_kg, bodyWeightDate: latest.date, items };
}
