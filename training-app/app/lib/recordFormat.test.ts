import { describe, expect, it } from 'vitest';
import { formatPace, formatRecordDetail } from './recordFormat';
import type { TrainingRecord } from '../types';

function record(overrides: Partial<TrainingRecord>): TrainingRecord {
  return { date: '2026-11-17', exercise: 'ランニング', weight: 0, reps: 1, sets: 1, memo: '', ...overrides };
}

describe('formatPace', () => {
  it('1kmあたりの時間を「分:秒」で返す', () => {
    expect(formatPace(30, 5)).toBe('6:00');
    expect(formatPace(25, 4.2)).toBe('5:57'); // 1500秒 ÷ 4.2 = 357.1秒
  });

  it('時間か距離が0以下なら null', () => {
    expect(formatPace(30, 0)).toBeNull();
    expect(formatPace(0, 5)).toBeNull();
  });
});

describe('formatRecordDetail', () => {
  it('筋トレは 重量×回数×セット数 で表示する', () => {
    expect(formatRecordDetail(record({ exercise: 'ベンチプレス', weight: 50, reps: 8, sets: 3, duration_minutes: null })))
      .toBe('50kg × 8回 × 3セット');
  });

  it('有酸素で距離がなければ時間だけ表示する', () => {
    expect(formatRecordDetail(record({ duration_minutes: 30 }))).toBe('30分');
    expect(formatRecordDetail(record({ duration_minutes: 30, distance_km: null }))).toBe('30分');
    expect(formatRecordDetail(record({ duration_minutes: 30, distance_km: 0 }))).toBe('30分');
  });

  it('有酸素で距離があれば、距離とペースも表示する', () => {
    expect(formatRecordDetail(record({ duration_minutes: 30, distance_km: 5 }))).toBe('30分・5km（6:00/km）');
  });

  it('距離は小数第2位までに丸める', () => {
    expect(formatRecordDetail(record({ duration_minutes: 30, distance_km: 5.256 }))).toBe('30分・5.26km（5:42/km）');
  });
});
