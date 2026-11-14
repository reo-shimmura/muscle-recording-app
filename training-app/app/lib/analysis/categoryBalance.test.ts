import { describe, expect, it } from 'vitest';
import { calcPushPullBalance, summarizeByCategory, type CategoryBalance } from './categoryBalance';
import type { TrainingRecord } from '../../types';

function record(date: string, exercise: string, overrides: Partial<TrainingRecord> = {}): TrainingRecord {
  return { date, exercise, weight: 50, reps: 10, sets: 2, duration_minutes: null, memo: '', ...overrides };
}

const categoryMap = { ベンチプレス: '胸', ラットプルダウン: '背中', ランニング: '有酸素', マイ種目: '前腕' };

describe('summarizeByCategory', () => {
  it('部位ごとに負荷量・セット数・実施日数を集計し、記録のない部位も 0 で含める', () => {
    const result = summarizeByCategory(
      [record('2026-11-10', 'ベンチプレス'), record('2026-11-10', 'ベンチプレス'), record('2026-11-12', 'ベンチプレス')],
      categoryMap,
      null
    );

    expect(result.find((b) => b.category === '胸')).toEqual({ category: '胸', volume: 3000, sets: 6, days: 2 });
    expect(result.find((b) => b.category === '脚')).toEqual({ category: '脚', volume: 0, sets: 0, days: 0 });
  });

  it('有酸素は含めず、カスタムのカテゴリは記録がある場合だけ足す', () => {
    const result = summarizeByCategory(
      [record('2026-11-10', 'ランニング', { weight: 0, duration_minutes: 30 }), record('2026-11-10', 'マイ種目')],
      categoryMap,
      null
    );
    const categories = result.map((b) => b.category);

    expect(categories).not.toContain('有酸素');
    expect(categories[categories.length - 1]).toBe('前腕');
  });

  it('開始日より前の記録は含めない', () => {
    const result = summarizeByCategory(
      [record('2026-10-01', 'ベンチプレス'), record('2026-11-10', 'ベンチプレス')],
      categoryMap,
      '2026-11-01'
    );
    expect(result.find((b) => b.category === '胸')?.days).toBe(1);
  });
});

describe('calcPushPullBalance', () => {
  const balance = (category: string, volume: number): CategoryBalance => ({ category, volume, sets: 0, days: 0 });

  it('押す（胸＋肩）÷ 引く（背中）の比率を求める', () => {
    const result = calcPushPullBalance([balance('胸', 1000), balance('肩', 500), balance('背中', 1500)]);
    expect(result).toEqual({ push: 1500, pull: 1500, ratio: 1, verdict: 'balanced' });
  });

  it('比率が 1.5 を超えると押す側、0.67 未満だと引く側に偏りと判定する', () => {
    expect(calcPushPullBalance([balance('胸', 2000), balance('背中', 1000)]).verdict).toBe('push-heavy');
    expect(calcPushPullBalance([balance('胸', 500), balance('背中', 1000)]).verdict).toBe('pull-heavy');
  });

  it('片方が 0 なら比率は出さず、もう片方への偏りとする。両方 0 ならデータ不足', () => {
    expect(calcPushPullBalance([balance('胸', 1000)])).toMatchObject({ ratio: null, verdict: 'push-heavy' });
    expect(calcPushPullBalance([balance('背中', 1000)])).toMatchObject({ ratio: null, verdict: 'pull-heavy' });
    expect(calcPushPullBalance([])).toMatchObject({ ratio: null, verdict: 'insufficient' });
  });
});
