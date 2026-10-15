/**
 * Epley式で推定1RM（1回だけ挙げられる最大重量）を算出する。
 * 1RM = 重量 × (1 + 回数 / 30)
 * 高回数（目安として20回超）では誤差が大きくなる点に留意。
 */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}
