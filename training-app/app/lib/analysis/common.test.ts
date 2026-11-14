import { describe, expect, it } from 'vitest';
import { addDaysStr, changeRate, diffDaysStr, isStrengthRecord, volumeOf } from './common';
import type { TrainingRecord } from '../../types';

const base: TrainingRecord = { date: '2026-11-01', exercise: 'ベンチプレス', weight: 50, reps: 10, sets: 3, duration_minutes: null, memo: '' };

describe('common', () => {
  it('負荷量は 重量×回数×セット数', () => {
    expect(volumeOf(base)).toBe(1500);
  });

  it('日付の加算は月・年をまたげる', () => {
    expect(addDaysStr('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDaysStr('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('日数の差を求める', () => {
    expect(diffDaysStr('2026-11-01', '2026-11-14')).toBe(13);
    expect(diffDaysStr('2026-11-14', '2026-11-01')).toBe(-13);
  });

  it('有酸素や時間で記録したものは筋トレの記録に含めない', () => {
    const map = { ベンチプレス: '胸', ランニング: '有酸素' };
    expect(isStrengthRecord(base, map)).toBe(true);
    expect(isStrengthRecord({ ...base, exercise: 'ランニング' }, map)).toBe(false);
    expect(isStrengthRecord({ ...base, duration_minutes: 30 }, map)).toBe(false);
  });

  it('増減率は小数第1位まで。前の値が0なら null', () => {
    expect(changeRate(110, 100)).toBe(10);
    expect(changeRate(2, 3)).toBe(-33.3);
    expect(changeRate(5, 0)).toBeNull();
  });
});
