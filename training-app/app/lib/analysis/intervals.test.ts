import { describe, expect, it } from 'vitest';
import { bucketIntervals, calcIntervals, summarizeIntervals } from './intervals';
import type { TrainingRecord } from '../../types';

function record(date: string): TrainingRecord {
  return { date, exercise: 'ベンチプレス', weight: 50, reps: 10, sets: 3, duration_minutes: null, memo: '' };
}

describe('calcIntervals', () => {
  it('同じ日の記録は1日として、日付順の間隔を返す', () => {
    const intervals = calcIntervals(['2026-11-10', '2026-11-05', '2026-11-05', '2026-11-12'].map(record));
    expect(intervals).toEqual([5, 2]);
  });

  it('記録が1日分以下なら空配列', () => {
    expect(calcIntervals([record('2026-11-05')])).toEqual([]);
  });
});

describe('bucketIntervals', () => {
  it('1〜7日は1日ずつ、8〜13日と14日以上はまとめて数える', () => {
    const buckets = bucketIntervals([1, 2, 2, 7, 8, 13, 14, 100]);
    const count = (label: string) => buckets.find((b) => b.label === label)?.count;

    expect(count('2日')).toBe(2);
    expect(count('7日')).toBe(1);
    expect(count('8〜13日')).toBe(2);
    expect(count('14日以上')).toBe(2);
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(8);
  });
});

describe('summarizeIntervals', () => {
  it('平均と中央値を求める', () => {
    expect(summarizeIntervals([2, 3, 10])).toEqual({ average: 5, median: 3 });
    expect(summarizeIntervals([2, 4])).toEqual({ average: 3, median: 3 });
  });

  it('間隔がなければ null', () => {
    expect(summarizeIntervals([])).toEqual({ average: null, median: null });
  });
});
