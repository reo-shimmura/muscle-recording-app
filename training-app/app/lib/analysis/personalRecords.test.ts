import { describe, expect, it } from 'vitest';
import { calcPersonalRecords } from './personalRecords';
import type { TrainingRecord } from '../../types';

function record(date: string, exercise: string, weight: number, reps: number): TrainingRecord {
  return { date, exercise, weight, reps, sets: 1, duration_minutes: null, memo: '' };
}

const categoryMap = { ベンチプレス: '胸', スクワット: '脚', プランク: '腹筋' };

describe('calcPersonalRecords', () => {
  it('最大重量と推定1RMの自己ベストを、別々に達成日付きで求める', () => {
    const [bench] = calcPersonalRecords(
      [record('2026-11-01', 'ベンチプレス', 60, 1), record('2026-11-05', 'ベンチプレス', 50, 12)],
      categoryMap,
      '2026-11-14'
    );

    // 最大重量は 11/1 の 60kg、推定1RMは 11/5 の 50×(1+12/30)=70
    expect(bench).toMatchObject({ maxWeight: 60, maxWeightDate: '2026-11-01', bestOneRepMax: 70, bestOneRepMaxDate: '2026-11-05' });
  });

  it('同じ値に再び届いても、最初に届いた日を達成日とする', () => {
    const [bench] = calcPersonalRecords(
      [record('2026-11-01', 'ベンチプレス', 60, 1), record('2026-11-08', 'ベンチプレス', 60, 1)],
      categoryMap,
      '2026-11-14'
    );
    expect(bench.maxWeightDate).toBe('2026-11-01');
  });

  it('重量0の記録は除き、更新日が新しい順に並べ、直近14日の更新に印を付ける', () => {
    const result = calcPersonalRecords(
      [record('2026-10-01', 'スクワット', 80, 5), record('2026-11-10', 'ベンチプレス', 50, 8), record('2026-11-12', 'プランク', 0, 1)],
      categoryMap,
      '2026-11-14'
    );

    expect(result.map((r) => [r.exercise, r.isRecent])).toEqual([
      ['ベンチプレス', true],
      ['スクワット', false],
    ]);
  });
});
