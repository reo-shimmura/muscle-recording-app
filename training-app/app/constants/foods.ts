/**
 * たんぱく質を記録できる食品の一覧。
 *
 * 含有量の出典: 文部科学省「日本食品標準成分表（八訂）増補2023年」の可食部100g当たりの「たんぱく質」
 * （食品成分データベース https://fooddb.mext.go.jp/ で確認。括弧内は食品番号）
 */
import { PROTEIN_POWDER_PROTEIN_RATIO, PROTEIN_SCOOP_G } from './protein';

export type FoodUnit = 'g' | '個';

export interface FoodDefinition {
  key: string;
  label: string;
  /** 記録する単位（g または 個） */
  unit: FoodUnit;
  /** 1単位あたりのたんぱく質（g） */
  proteinPerUnit: number;
  /** 入力の初期値・刻み・上限（1回の記録あたり） */
  defaultQuantity: number;
  step: number;
  maxQuantity: number;
}

export const PROTEIN_POWDER_KEY = 'protein_powder';

// 卵（Mサイズ・殻つき58〜64g）1個の可食部を約50gとみなす
const EGG_EDIBLE_G = 50;
// 鶏卵 全卵 生（12004）: 12.2g / 100g
const EGG_PROTEIN_PER_100G = 12.2;

/** 100g当たりの値を、1g当たりに直す */
const per100g = (protein: number) => protein / 100;

export const FOODS: FoodDefinition[] = [
  {
    key: PROTEIN_POWDER_KEY,
    label: 'プロテイン',
    unit: 'g', // 粉の量
    proteinPerUnit: PROTEIN_POWDER_PROTEIN_RATIO,
    defaultQuantity: PROTEIN_SCOOP_G,
    step: 3,
    maxQuantity: PROTEIN_SCOOP_G,
  },
  {
    key: 'egg',
    label: '卵（Mサイズ）',
    unit: '個',
    proteinPerUnit: (EGG_PROTEIN_PER_100G * EGG_EDIBLE_G) / 100, // 6.1g / 個
    defaultQuantity: 1,
    step: 1,
    maxQuantity: 20,
  },
  // 若どり むね 皮なし 生（11220）: 23.3g
  { key: 'chicken_breast_skinless', label: '鶏むね肉（皮なし）', unit: 'g', proteinPerUnit: per100g(23.3), defaultQuantity: 100, step: 10, maxQuantity: 2000 },
  // 若どり むね 皮つき 生（11219）: 21.3g
  { key: 'chicken_breast_skin', label: '鶏むね肉（皮つき）', unit: 'g', proteinPerUnit: per100g(21.3), defaultQuantity: 100, step: 10, maxQuantity: 2000 },
  // 若どり もも 皮なし 生（11224）: 19.0g
  { key: 'chicken_thigh_skinless', label: '鶏もも肉（皮なし）', unit: 'g', proteinPerUnit: per100g(19.0), defaultQuantity: 100, step: 10, maxQuantity: 2000 },
  // 若どり もも 皮つき 生（11221）: 16.6g
  { key: 'chicken_thigh_skin', label: '鶏もも肉（皮つき）', unit: 'g', proteinPerUnit: per100g(16.6), defaultQuantity: 100, step: 10, maxQuantity: 2000 },
  // 若どり ささみ 生（11227）: 23.9g
  { key: 'chicken_tender', label: '鶏ささみ', unit: 'g', proteinPerUnit: per100g(23.9), defaultQuantity: 100, step: 10, maxQuantity: 2000 },
  // にわとり ひき肉 生（11230）: 17.5g
  { key: 'minced_chicken', label: '鶏ひき肉', unit: 'g', proteinPerUnit: per100g(17.5), defaultQuantity: 100, step: 10, maxQuantity: 2000 },
  // ぶた ひき肉 生（11163）: 17.7g
  { key: 'minced_pork', label: '豚ひき肉', unit: 'g', proteinPerUnit: per100g(17.7), defaultQuantity: 100, step: 10, maxQuantity: 2000 },
  // うし ひき肉 生（11089）: 17.1g
  { key: 'minced_beef', label: '牛ひき肉', unit: 'g', proteinPerUnit: per100g(17.1), defaultQuantity: 100, step: 10, maxQuantity: 2000 },
];

export const FOOD_BY_KEY: Record<string, FoodDefinition> = Object.fromEntries(FOODS.map((f) => [f.key, f]));

/** 食品と量から、たんぱく質（g、小数第1位）を計算する。未知の食品なら null */
export function calcProteinGrams(foodKey: string, quantity: number): number | null {
  const food = FOOD_BY_KEY[foodKey];
  if (!food) return null;
  return Math.round(food.proteinPerUnit * quantity * 10) / 10;
}

/** 記録の量を表示用にする（例: 2個、200g、プロテインは「1杯（30g）」のように） */
export function formatFoodQuantity(foodKey: string, quantity: number): string {
  const food = FOOD_BY_KEY[foodKey];
  if (!food) return `${quantity}`;
  if (foodKey === PROTEIN_POWDER_KEY) {
    const cups = Math.round((quantity / PROTEIN_SCOOP_G) * 10) / 10;
    return `${cups}杯（${quantity}g）`;
  }
  return `${quantity}${food.unit}`;
}
