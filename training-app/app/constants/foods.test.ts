import { describe, expect, it } from 'vitest';
import { calcProteinGrams, FOOD_BY_KEY, FOODS, formatFoodQuantity, PROTEIN_POWDER_KEY } from './foods';

describe('FOODS', () => {
  it('プロテイン・卵・鶏むね・鶏もも・ひき肉が含まれ、key は重複しない', () => {
    const keys = FOODS.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of [PROTEIN_POWDER_KEY, 'egg', 'chicken_breast_skinless', 'chicken_thigh_skin', 'minced_pork']) {
      expect(FOOD_BY_KEY[key]).toBeDefined();
    }
  });

  it('卵は個数、肉はg数で記録する', () => {
    expect(FOOD_BY_KEY.egg.unit).toBe('個');
    expect(FOOD_BY_KEY.chicken_breast_skinless.unit).toBe('g');
  });
});

describe('calcProteinGrams（日本食品標準成分表の値で換算）', () => {
  it('プロテインは粉の7割（1杯30g → 21g）', () => {
    expect(calcProteinGrams(PROTEIN_POWDER_KEY, 30)).toBe(21);
    expect(calcProteinGrams(PROTEIN_POWDER_KEY, 15)).toBe(10.5);
  });

  it('卵は1個（可食部50g）あたり 12.2g/100g × 50g = 6.1g', () => {
    expect(calcProteinGrams('egg', 1)).toBe(6.1);
    expect(calcProteinGrams('egg', 3)).toBe(18.3);
  });

  it('肉は100gあたりの値 × g数', () => {
    expect(calcProteinGrams('chicken_breast_skinless', 200)).toBe(46.6);
    expect(calcProteinGrams('chicken_thigh_skin', 150)).toBe(24.9);
    expect(calcProteinGrams('minced_beef', 100)).toBe(17.1);
  });

  it('一覧にない食品なら null', () => {
    expect(calcProteinGrams('unknown', 100)).toBeNull();
  });
});

describe('formatFoodQuantity', () => {
  it('プロテインは杯数と粉のg、その他は食品の単位で表示する', () => {
    expect(formatFoodQuantity(PROTEIN_POWDER_KEY, 21)).toBe('0.7杯（21g）');
    expect(formatFoodQuantity('egg', 2)).toBe('2個');
    expect(formatFoodQuantity('chicken_breast_skinless', 200)).toBe('200g');
  });
});
