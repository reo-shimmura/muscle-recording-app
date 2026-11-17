import { describe, expect, it } from 'vitest';
import { buildProteinMeter, dailyProteinTarget, ratioToGrams, sumProteinByDate } from './protein';
import type { ProteinIntake, TrainingRecord } from '../types';

function intake(id: number, date: string, amount_g: number): ProteinIntake {
  return { id, date, amount_g };
}

function record(date: string): TrainingRecord {
  return { date, exercise: 'ベンチプレス', weight: 50, reps: 10, sets: 3, memo: '' };
}

describe('ratioToGrams', () => {
  it('1杯（30g）のうちの割合を g にする', () => {
    expect(ratioToGrams(1)).toBe(30);
    expect(ratioToGrams(0.7)).toBe(21);
    expect(ratioToGrams(0.1)).toBe(3);
  });

  it('0〜1 の範囲に収める', () => {
    expect(ratioToGrams(1.5)).toBe(30);
    expect(ratioToGrams(-0.2)).toBe(0);
  });
});

describe('sumProteinByDate', () => {
  it('同じ日の記録を合計する', () => {
    const totals = sumProteinByDate([intake(1, '2026-11-17', 30), intake(2, '2026-11-17', 21), intake(3, '2026-11-16', 15)]);
    expect(totals.get('2026-11-17')).toBe(51);
    expect(totals.get('2026-11-16')).toBe(15);
  });
});

describe('dailyProteinTarget', () => {
  it('筋トレの記録がある日は2杯（60g）、ない日は1杯（30g）', () => {
    const records = [record('2026-11-17')];
    expect(dailyProteinTarget(records, '2026-11-17')).toBe(60);
    expect(dailyProteinTarget(records, '2026-11-16')).toBe(30);
  });
});

describe('buildProteinMeter', () => {
  it('目安を右端として、飲んだ量・今回の量・目安の位置を % で返す', () => {
    expect(buildProteinMeter(30, 21, 60)).toEqual({
      max: 60,
      consumedPercent: 50,
      addingPercent: 35,
      targetPercent: 100,
      total: 51,
      remaining: 9,
    });
  });

  it('合計が目安を超えたら、合計を右端にして目安の線を手前に出す', () => {
    const meter = buildProteinMeter(60, 30, 60);
    expect(meter.max).toBe(90);
    expect(meter.targetPercent).toBeCloseTo(66.7);
    expect(meter.remaining).toBe(0);
  });

  it('まだ何も飲んでいなくても計算できる', () => {
    expect(buildProteinMeter(0, 0, 30)).toMatchObject({ consumedPercent: 0, addingPercent: 0, total: 0, remaining: 30 });
  });
});
