import { describe, expect, it } from 'vitest';
import { buildMonthlyBodyTrend, hasBodyTrendData } from './monthlyTrend';
import type { BodyWeight, FoodIntake, TrainingRecord } from '../types';

const intakes: FoodIntake[] = [
  { id: 1, date: '2026-11-03', food_key: 'protein_powder', quantity: 30, protein_g: 21 },
  { id: 2, date: '2026-11-03', food_key: 'chicken_breast_skinless', quantity: 100, protein_g: 23.3 },
  { id: 3, date: '2026-10-31', food_key: 'egg', quantity: 2, protein_g: 12.2 },
];
const bodyWeights: BodyWeight[] = [
  { id: 1, date: '2026-11-02', weight_kg: 70 },
  { id: 2, date: '2026-11-05', weight_kg: 70.2 },
];
const records: TrainingRecord[] = [{ date: '2026-11-03', exercise: 'ベンチプレス', weight: 50, reps: 10, sets: 3, memo: '' }];

describe('buildMonthlyBodyTrend', () => {
  // 2026年11月（month = 10）
  const trend = buildMonthlyBodyTrend(2026, 10, intakes, bodyWeights, records);

  it('その月の1日〜末日を並べる（11月は30日）', () => {
    expect(trend).toHaveLength(30);
    expect(trend[0].date).toBe('2026-11-01');
    expect(trend[29].date).toBe('2026-11-30');
  });

  it('たんぱく質はプロテインと食事を日ごとに合計し、記録のない日は null', () => {
    expect(trend[2]).toMatchObject({ day: 3, protein: 44.3 });
    expect(trend[0].protein).toBeNull();
  });

  it('目安はその日までの最新の体重×2.0g（筋トレした日）または×1.6g（休みの日）。体重がない日は null', () => {
    expect(trend[0].target).toBeNull(); // 11/1 はまだ体重の記録がない
    expect(trend[2].target).toBe(140); // 11/3 筋トレ 70kg × 2.0
    expect(trend[3].target).toBe(112); // 11/4 休み 70kg × 1.6
  });

  it('体重はその日の記録、なければ null', () => {
    expect(trend[4].bodyWeight).toBe(70.2);
    expect(trend[5].bodyWeight).toBeNull();
    expect(trend[1].bodyWeight).toBe(70);
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
