import { describe, expect, it } from 'vitest';
import { calcScrollWidthPercent } from './ScrollableTimeChart';
import { buildTimeAxis } from '../../lib/chartTimeAxis';

describe('calcScrollWidthPercent', () => {
  // 2026-07-17 〜 2026-11-14 の120日間の軸
  const axis = buildTimeAxis(['2026-07-17'], null, '2026-11-14')!;

  it('1画面の日数を指定しなければ100%（スクロールなし）', () => {
    expect(calcScrollWidthPercent(axis, null)).toBe(100);
  });

  it('全期間 ÷ 1画面の日数 の分だけ横に広げる', () => {
    expect(calcScrollWidthPercent(axis, 30)).toBe(400);
    expect(calcScrollWidthPercent(axis, 60)).toBe(200);
  });

  it('全期間より1画面の方が長ければ100%のまま', () => {
    expect(calcScrollWidthPercent(axis, 365)).toBe(100);
  });
});
