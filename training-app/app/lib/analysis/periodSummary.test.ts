import { describe, expect, it } from 'vitest';
import { summarizeByPeriod } from './periodSummary';
import type { TrainingRecord } from '../../types';

function record(date: string, overrides: Partial<TrainingRecord> = {}): TrainingRecord {
  return { date, exercise: 'ベンチプレス', weight: 50, reps: 10, sets: 3, duration_minutes: null, memo: '', ...overrides };
}

describe('summarizeByPeriod（週）', () => {
  // 2026-11-14 は土曜日。今週は 11/9(月)〜11/15(日)
  it('月曜始まりの週で集計し、古い順に並べる', () => {
    const result = summarizeByPeriod(
      [record('2026-11-10'), record('2026-11-10'), record('2026-11-12'), record('2026-11-05')],
      'week',
      '2026-11-14',
      2
    );

    expect(result.map((s) => s.start)).toEqual(['2026-11-02', '2026-11-09']);
    expect(result[1]).toMatchObject({ label: '11/9', days: 2, volume: 4500, sets: 9 });
    expect(result[0]).toMatchObject({ days: 1, volume: 1500 });
  });

  it('記録のない週も 0 で含める', () => {
    const result = summarizeByPeriod([record('2026-11-12')], 'week', '2026-11-14', 3);
    expect(result.map((s) => s.days)).toEqual([0, 0, 1]);
  });

  it('時間で記録した有酸素はセット数に含めない', () => {
    const [week] = summarizeByPeriod(
      [record('2026-11-12', { exercise: 'ランニング', weight: 0, duration_minutes: 30 })],
      'week',
      '2026-11-14',
      1
    );
    expect(week).toMatchObject({ days: 1, volume: 0, sets: 0 });
  });
});

describe('summarizeByPeriod（月）', () => {
  it('月ごとに集計し、年をまたいでもさかのぼれる', () => {
    const result = summarizeByPeriod([record('2026-12-31'), record('2027-01-02')], 'month', '2027-01-10', 2);

    expect(result.map((s) => [s.start, s.label, s.days])).toEqual([
      ['2026-12-01', '12月', 1],
      ['2027-01-01', '1月', 1],
    ]);
  });
});
