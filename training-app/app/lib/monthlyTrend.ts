import type { BodyWeight, ProteinIntake, TrainingRecord } from '../types';
import { dailyProteinTarget, sumProteinByDate } from './protein';

export interface DailyBodyTrend {
  date: string;
  /** その月の何日か（グラフの横軸） */
  day: number;
  /** その日のプロテインの合計（g）。記録がなければ null（棒を出さない） */
  protein: number | null;
  /** その日のプロテインの目安（g） */
  target: number;
  /** その日の体重（kg）。記録がなければ null（線は前後をつなぐ） */
  bodyWeight: number | null;
}

/** 'YYYY-MM-DD' を作る（month は 0 始まり） */
function dateOf(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * 表示中の月（month は 0 始まり）の1日〜末日について、プロテインの合計・目安・体重をまとめる。
 * カレンダーの下の推移グラフで使う。
 */
export function buildMonthlyBodyTrend(
  year: number,
  month: number,
  proteinIntakes: ProteinIntake[],
  bodyWeights: BodyWeight[],
  records: TrainingRecord[]
): DailyBodyTrend[] {
  const proteinByDate = sumProteinByDate(proteinIntakes);
  const weightByDate = new Map(bodyWeights.map((b) => [b.date, b.weight_kg]));
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = dateOf(year, month, i + 1);
    return {
      date,
      day: i + 1,
      protein: proteinByDate.get(date) ?? null,
      target: dailyProteinTarget(records, date),
      bodyWeight: weightByDate.get(date) ?? null,
    };
  });
}

/** その月にプロテインか体重の記録が1件でもあるか（なければグラフの代わりに案内を出す） */
export function hasBodyTrendData(trend: DailyBodyTrend[]): boolean {
  return trend.some((d) => d.protein !== null || d.bodyWeight !== null);
}
