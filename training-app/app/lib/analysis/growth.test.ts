import { describe, expect, it } from 'vitest';
import { calcGrowth } from './growth';
import type { TrainingRecord } from '../../types';

function record(date: string, exercise: string, weight: number): TrainingRecord {
  // 1回で記録して、推定1RM = 重量 にしてテストを読みやすくする
  return { date, exercise, weight, reps: 1, sets: 1, duration_minutes: null, memo: '' };
}

const categoryMap = { ベンチプレス: '胸', スクワット: '脚', デッドリフト: '背中' };

describe('calcGrowth', () => {
  // 今日 11/14、直近30日 = 10/16〜11/14
  const today = '2026-11-14';

  it('直近のベストを、それより前のベストと比べた伸び率を求め、高い順に並べる', () => {
    const result = calcGrowth(
      [
        record('2026-10-01', 'ベンチプレス', 50),
        record('2026-11-10', 'ベンチプレス', 55),
        record('2026-10-01', 'スクワット', 100),
        record('2026-11-10', 'スクワット', 90),
      ],
      categoryMap,
      today,
      30
    );

    expect(result).toEqual([
      { exercise: 'ベンチプレス', past: 50, recent: 55, rate: 10 },
      { exercise: 'スクワット', past: 100, recent: 90, rate: -10 },
    ]);
  });

  it('直近の期間の初日は「直近」に含める', () => {
    const [bench] = calcGrowth(
      [record('2026-10-15', 'ベンチプレス', 50), record('2026-10-16', 'ベンチプレス', 60)],
      categoryMap,
      today,
      30
    );
    expect(bench).toMatchObject({ past: 50, recent: 60 });
  });

  it('どちらかの期間に記録がない種目は含めない', () => {
    const result = calcGrowth(
      [record('2026-10-01', 'スクワット', 100), record('2026-11-10', 'デッドリフト', 100)],
      categoryMap,
      today,
      30
    );
    expect(result).toEqual([]);
  });
});
