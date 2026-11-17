import { describe, expect, it } from 'vitest';
import { buildMonthlyBodyTrend, hasBodyTrendData } from './monthlyTrend';
import type { BodyWeight, ProteinIntake, TrainingRecord } from '../types';

const intakes: ProteinIntake[] = [
  { id: 1, date: '2026-11-03', amount_g: 30 },
  { id: 2, date: '2026-11-03', amount_g: 15 },
  { id: 3, date: '2026-10-31', amount_g: 30 },
];
const bodyWeights: BodyWeight[] = [{ id: 1, date: '2026-11-05', weight_kg: 70.2 }];
const records: TrainingRecord[] = [{ date: '2026-11-03', exercise: 'ベンチプレス', weight: 50, reps: 10, sets: 3, memo: '' }];

describe('buildMonthlyBodyTrend', () => {
  // 2026年11月（month = 10）
  const trend = buildMonthlyBodyTrend(2026, 10, intakes, bodyWeights, records);

  it('その月の1日〜末日を並べる（11月は30日）', () => {
    expect(trend).toHaveLength(30);
    expect(trend[0].date).toBe('2026-11-01');
    expect(trend[29].date).toBe('2026-11-30');
  });

  it('プロテインは日ごとに合計し、記録のない日は null', () => {
    expect(trend[2]).toMatchObject({ day: 3, protein: 45 });
    expect(trend[0].protein).toBeNull();
  });

  it('目安は筋トレした日が60g、休みの日が30g', () => {
    expect(trend[2].target).toBe(60);
    expect(trend[3].target).toBe(30);
  });

  it('体重はその日の記録、なければ null', () => {
    expect(trend[4].bodyWeight).toBe(70.2);
    expect(trend[5].bodyWeight).toBeNull();
  });

  it('ほかの月の記録は含めない', () => {
    expect(trend.some((d) => d.date === '2026-10-31')).toBe(false);
  });
});

describe('hasBodyTrendData', () => {
  it('プロテインか体重の記録が1件でもあれば true', () => {
    expect(hasBodyTrendData(buildMonthlyBodyTrend(2026, 10, intakes, bodyWeights, records))).toBe(true);
    expect(hasBodyTrendData(buildMonthlyBodyTrend(2026, 8, intakes, bodyWeights, records))).toBe(false);
  });
});
