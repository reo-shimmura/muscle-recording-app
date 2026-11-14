import { describe, expect, it } from 'vitest';
import { estimateOneRepMax } from './oneRepMax';

describe('estimateOneRepMax', () => {
  it('重量または回数が0以下なら0を返す', () => {
    expect(estimateOneRepMax(0, 10)).toBe(0);
    expect(estimateOneRepMax(60, 0)).toBe(0);
    expect(estimateOneRepMax(-10, 5)).toBe(0);
  });

  it('1回の場合は重量そのものを返す', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
  });

  it('Epley式で算出し、小数第1位に丸める', () => {
    // 60 × (1 + 10/30) = 80
    expect(estimateOneRepMax(60, 10)).toBe(80);
    // 47.5 × (1 + 8/30) = 60.1666… → 60.2
    expect(estimateOneRepMax(47.5, 8)).toBe(60.2);
  });
});
