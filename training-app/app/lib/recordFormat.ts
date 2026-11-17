import type { TrainingRecord } from '../types';

/** 小数第2位までに丸めて表示する（例: 5.256 → 5.26、5 → 5） */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * 1kmあたりのペースを「分:秒」で返す（例: 30分で5km → 6:00）。
 * 時間か距離が0以下なら計算できないので null。
 */
export function formatPace(durationMinutes: number, distanceKm: number): string | null {
  if (durationMinutes <= 0 || distanceKm <= 0) return null;
  const totalSeconds = Math.round((durationMinutes * 60) / distanceKm);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

/**
 * 記録1件の内容を表示用の文字列にする。
 * - 有酸素（時間で記録）: 「30分」、距離があれば「30分・5km（6:00/km）」
 * - 筋トレ: 「50kg × 8回 × 3セット」
 */
export function formatRecordDetail(record: TrainingRecord): string {
  if (record.duration_minutes == null) {
    return `${record.weight}kg × ${record.reps}回 × ${record.sets}セット`;
  }

  const distance = record.distance_km ?? 0;
  const parts = [`${round2(record.duration_minutes)}分`];
  if (distance > 0) parts.push(`${round2(distance)}km`);

  const pace = formatPace(record.duration_minutes, distance);
  return pace ? `${parts.join('・')}（${pace}/km）` : parts.join('・');
}
