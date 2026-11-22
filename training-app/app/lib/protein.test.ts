import { describe, expect, it } from 'vitest';
import {
  bodyWeightOn,
  buildProteinMeter,
  dailyProteinTarget,
  powderIntakes,
  ratioToGrams,
  sumProteinByDate,
} from './protein';
import type { BodyWeight, FoodIntake, TrainingRecord } from '../types';

function intake(id: number, date: string, food_key: string, protein_g: number): FoodIntake {
  return { id, date, food_key, quantity: 1, protein_g };
}

function record(date: string): TrainingRecord {
  return { date, exercise: 'ベンチプレス', weight: 50, reps: 10, sets: 3, memo: '' };
}

function bodyWeight(date: string, weight_kg: number): BodyWeight {
  return { id: 1, date, weight_kg };
}

describe('ratioToGrams', () => {
  it('1杯（粉30g）のうちの割合を粉の g にし、0〜1 の範囲に収める', () => {
    expect(ratioToGrams(0.7)).toBe(21);
    expect(ratioToGrams(1.5)).toBe(30);
    expect(ratioToGrams(-0.2)).toBe(0);
  });
});

describe('sumProteinByDate', () => {
  it('プロテインも食事も、同じ日のたんぱく質を合計する', () => {
    const totals = sumProteinByDate([
      intake(1, '2026-11-17', 'protein_powder', 21),
      intake(2, '2026-11-17', 'egg', 12.2),
      intake(3, '2026-11-16', 'chicken_breast_skinless', 46.6),
    ]);
    expect(totals.get('2026-11-17')).toBe(33.2);
    expect(totals.get('2026-11-16')).toBe(46.6);
  });
});

describe('powderIntakes', () => {
  it('プロテイン（粉）の記録だけを取り出す', () => {
    const result = powderIntakes([intake(1, '2026-11-17', 'protein_powder', 21), intake(2, '2026-11-17', 'egg', 6.1)]);
    expect(result.map((i) => i.id)).toEqual([1]);
  });
});

describe('bodyWeightOn', () => {
  const weights = [bodyWeight('2026-11-10', 71), bodyWeight('2026-11-15', 70), bodyWeight('2026-11-20', 69)];

  it('その日までで最も新しい体重を返し、その日より後の記録は使わない', () => {
    expect(bodyWeightOn(weights, '2026-11-17')?.weight_kg).toBe(70);
    expect(bodyWeightOn(weights, '2026-11-20')?.weight_kg).toBe(69);
  });

  it('その日までに記録がなければ null', () => {
    expect(bodyWeightOn(weights, '2026-11-09')).toBeNull();
  });
});

describe('dailyProteinTarget', () => {
  const weights = [bodyWeight('2026-11-15', 70)];

  it('筋トレした日は体重×2.0g、休みの日は体重×1.6g', () => {
    const records = [record('2026-11-17')];
    expect(dailyProteinTarget(records, weights, '2026-11-17')).toMatchObject({ grams: 140, gramsPerKg: 2, trained: true, bodyWeightKg: 70 });
    expect(dailyProteinTarget(records, weights, '2026-11-16')).toMatchObject({ grams: 112, gramsPerKg: 1.6, trained: false });
  });

  it('その日までに体重の記録がなければ null', () => {
    expect(dailyProteinTarget([], weights, '2026-11-14')).toBeNull();
  });
});

describe('buildProteinMeter', () => {
  it('目安を右端として、摂った量・今回の量・目安の位置を % で返す', () => {
    expect(buildProteinMeter(60, 21, 120)).toEqual({
      max: 120,
      consumedPercent: 50,
      addingPercent: 17.5,
      targetPercent: 100,
      total: 81,
      remaining: 39,
    });
  });

  it('合計が目安を超えたら、合計を右端にして目安の線を手前に出す', () => {
    const meter = buildProteinMeter(120, 30, 120);
    expect(meter.max).toBe(150);
    expect(meter.targetPercent).toBe(80);
    expect(meter.remaining).toBe(0);
  });

  it('目安がない（体重が未記録）ときは、目安の位置と残りを null にする', () => {
    expect(buildProteinMeter(30, 20, null)).toMatchObject({ max: 50, targetPercent: null, remaining: null, total: 50 });
  });
});
