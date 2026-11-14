import { describe, expect, it } from 'vitest';
import { calcLastTrainedByCategory } from './lastTrained';
import type { TrainingRecord } from '../../types';

function record(date: string, exercise: string): TrainingRecord {
  return { date, exercise, weight: 50, reps: 10, sets: 3, duration_minutes: null, memo: '' };
}

const categoryMap = { ベンチプレス: '胸', スクワット: '脚', ラットプルダウン: '背中' };

describe('calcLastTrainedByCategory', () => {
  it('部位ごとの最終日と経過日数を求め、空いている順に並べる', () => {
    const result = calcLastTrainedByCategory(
      [record('2026-11-01', 'ベンチプレス'), record('2026-11-12', 'ベンチプレス'), record('2026-11-05', 'スクワット')],
      categoryMap,
      ['胸', '脚'],
      '2026-11-14'
    );

    expect(result).toEqual([
      { category: '脚', lastDate: '2026-11-05', daysAgo: 9 },
      { category: '胸', lastDate: '2026-11-12', daysAgo: 2 },
    ]);
  });

  it('一度もやっていない部位は null で先頭に置く', () => {
    const result = calcLastTrainedByCategory([record('2026-11-12', 'ベンチプレス')], categoryMap, ['胸', '背中'], '2026-11-14');

    expect(result[0]).toEqual({ category: '背中', lastDate: null, daysAgo: null });
    expect(result[1].category).toBe('胸');
  });

  it('未登録の種目は「その他」として数える', () => {
    const result = calcLastTrainedByCategory([record('2026-11-14', '謎の種目')], categoryMap, ['その他'], '2026-11-14');
    expect(result[0]).toEqual({ category: 'その他', lastDate: '2026-11-14', daysAgo: 0 });
  });
});
