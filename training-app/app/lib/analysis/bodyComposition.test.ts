import { describe, expect, it } from 'vitest';
import { calcRelativeStrength, latestBodyWeight, summarizeWeeklyBody } from './bodyComposition';
import type { PersonalRecord } from './personalRecords';
import type { BodyWeight, TrainingRecord } from '../../types';

function record(date: string): TrainingRecord {
  return { date, exercise: 'ベンチプレス', weight: 50, reps: 10, sets: 1, duration_minutes: null, memo: '' };
}

function bodyWeight(date: string, weight_kg: number, id = 1): BodyWeight {
  return { id, date, weight_kg };
}

function pr(exercise: string, bestOneRepMax: number): PersonalRecord {
  return {
    exercise,
    category: '',
    maxWeight: 0,
    maxWeightDate: '2026-11-01',
    bestOneRepMax,
    bestOneRepMaxDate: '2026-11-01',
    isRecent: false,
  };
}

describe('summarizeWeeklyBody', () => {
  it('週ごとの負荷量と平均体重を並べ、体重の記録がない週は null', () => {
    // 2026-11-14(土) の週は 11/9〜11/15、前の週は 11/2〜11/8
    const result = summarizeWeeklyBody(
      [record('2026-11-10'), record('2026-11-03')],
      [bodyWeight('2026-11-10', 70), bodyWeight('2026-11-12', 71)],
      '2026-11-14',
      2
    );

    expect(result).toEqual([
      { start: '2026-11-02', label: '11/2', volume: 500, bodyWeight: null },
      { start: '2026-11-09', label: '11/9', volume: 500, bodyWeight: 70.5 },
    ]);
  });
});

describe('latestBodyWeight', () => {
  it('日付が最も新しい記録を返し、なければ null', () => {
    expect(latestBodyWeight([bodyWeight('2026-11-12', 71), bodyWeight('2026-11-01', 70)])?.weight_kg).toBe(71);
    expect(latestBodyWeight([])).toBeNull();
  });
});

describe('calcRelativeStrength', () => {
  it('推定1RMの自己ベストを最新の体重で割り、倍率の高い順に並べる', () => {
    const result = calcRelativeStrength([pr('ベンチプレス', 56), pr('スクワット', 105)], [bodyWeight('2026-11-12', 70)]);

    expect(result).toEqual({
      bodyWeight: 70,
      bodyWeightDate: '2026-11-12',
      items: [
        { exercise: 'スクワット', oneRepMax: 105, ratio: 1.5 },
        { exercise: 'ベンチプレス', oneRepMax: 56, ratio: 0.8 },
      ],
    });
  });

  it('体重の記録がなければ null', () => {
    expect(calcRelativeStrength([pr('ベンチプレス', 56)], [])).toBeNull();
  });
});
