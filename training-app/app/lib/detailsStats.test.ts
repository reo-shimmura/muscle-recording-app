import { describe, expect, it } from 'vitest';
import { aggregateDailyStats, getRangeDays } from './detailsStats';
import type { TrainingRecord } from '../types';

// テスト用の記録を簡潔に作るヘルパー
function record(overrides: Partial<TrainingRecord>): TrainingRecord {
  return {
    date: '2026-11-01',
    exercise: 'ベンチプレス',
    weight: 0,
    reps: 1,
    sets: 1,
    duration_minutes: null,
    memo: '',
    ...overrides,
  };
}

describe('aggregateDailyStats', () => {
  it('記録が空なら空配列を返す', () => {
    expect(aggregateDailyStats([])).toEqual([]);
  });

  it('同じ日の記録を合算し、最大値は日ごとの最大を取る', () => {
    const [day] = aggregateDailyStats([
      record({ weight: 50, reps: 8, sets: 3 }),
      record({ weight: 45, reps: 10, sets: 1 }),
    ]);

    expect(day.dailyVolume).toBe(50 * 8 * 3 + 45 * 10 * 1);
    expect(day.maxWeight).toBe(50);
    expect(day.setCount).toBe(4);
    expect(day.sessionCount).toBe(2);
  });

  it('日付の昇順に並べ、累計値を積み上げる', () => {
    const stats = aggregateDailyStats([
      record({ date: '2026-11-03', weight: 10, reps: 10, sets: 1 }),
      record({ date: '2026-11-01', weight: 20, reps: 5, sets: 2 }),
    ]);

    expect(stats.map((s) => s.date)).toEqual(['2026-11-01', '2026-11-03']);
    expect(stats.map((s) => s.totalVolume)).toEqual([200, 300]);
  });

  it('有酸素種目の時間(分)を日別・累計で集計する', () => {
    const stats = aggregateDailyStats([
      record({ date: '2026-11-01', exercise: 'ランニング', duration_minutes: 30 }),
      record({ date: '2026-11-02', exercise: 'ランニング', duration_minutes: 20 }),
    ]);

    expect(stats.map((s) => s.durationMinutes)).toEqual([30, 20]);
    expect(stats.map((s) => s.totalDurationMinutes)).toEqual([30, 50]);
  });
});

describe('getRangeDays', () => {
  it('全期間なら null（1画面に全体を収める）を返す', () => {
    expect(getRangeDays('all')).toBeNull();
  });

  it('各範囲の1画面の日数を返す', () => {
    expect(getRangeDays('1w')).toBe(7);
    expect(getRangeDays('2w')).toBe(14);
    expect(getRangeDays('1m')).toBe(30);
    expect(getRangeDays('3m')).toBe(90);
  });
});
