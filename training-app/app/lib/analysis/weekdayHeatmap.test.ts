import { describe, expect, it } from 'vitest';
import { buildWeekdayHeatmap, countByWeekday } from './weekdayHeatmap';
import type { TrainingRecord } from '../../types';

function record(date: string, weight = 50): TrainingRecord {
  return { date, exercise: 'ベンチプレス', weight, reps: 10, sets: 1, duration_minutes: null, memo: '' };
}

describe('buildWeekdayHeatmap', () => {
  // 2026-11-14 は土曜日
  const today = '2026-11-14';

  it('週（列）×曜日（行・月曜始まり）で並び、最後の列が今週', () => {
    const grid = buildWeekdayHeatmap([], today, 2);

    expect(grid).toHaveLength(2);
    expect(grid[0][0].date).toBe('2026-11-02');
    expect(grid[1][0].date).toBe('2026-11-09');
    expect(grid[1][6].date).toBe('2026-11-15');
  });

  it('未来の日には future を付ける', () => {
    const grid = buildWeekdayHeatmap([], today, 1);
    expect(grid[0][5].future).toBe(false); // 11/14(土)
    expect(grid[0][6].future).toBe(true); // 11/15(日)
  });

  it('記録のない日は0、負荷量が多い日ほど濃くなる（最大は4）', () => {
    const grid = buildWeekdayHeatmap([record('2026-11-10', 100), record('2026-11-12', 20)], today, 1);
    const levels = grid[0].map((c) => c.level);

    expect(levels[0]).toBe(0); // 11/9(月) 記録なし
    expect(levels[1]).toBe(4); // 11/10(火) 最大
    expect(levels[3]).toBe(1); // 11/12(木) 最大の2割
  });
});

describe('countByWeekday', () => {
  it('同じ日の複数記録は1回として、曜日ごとに数える', () => {
    // 11/9(月) ×2件、11/14(土)、11/15(日)
    const counts = countByWeekday([record('2026-11-09'), record('2026-11-09'), record('2026-11-14'), record('2026-11-15')]);
    expect(counts).toEqual([1, 0, 0, 0, 0, 1, 1]);
  });
});
