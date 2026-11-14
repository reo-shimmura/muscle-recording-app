/**
 * モチベーション（継続度）の推移を、エビングハウスの忘却曲線に似たモデルで計算する。
 * - 記録した日: その日の「濃さ」に応じて値が 100 に向かって上がる（1回で埋まるのは残りの最大半分）
 * - 記録のない日: 値が指数関数的に下がる
 * - 定着度: 間を空けずに続けるほど下がり方がゆるやかになり、長く空くと元に戻っていく
 */
import type { TrainingRecord } from '../types';
import { parseLocalDate } from './chartTimeAxis';
import { toDateStr } from './goalsProgress';

export interface MotivationPoint {
  date: string;
  /** 日付0時のミリ秒（グラフの横軸用） */
  time: number;
  /** モチベーション値（0〜100） */
  level: number;
  /** 記録した日なら true（跳ね上がった後の点） */
  isSession: boolean;
}

export type MotivationStatus = 'good' | 'steady' | 'warning';

export interface MotivationResult {
  points: MotivationPoint[];
  current: number;
  status: MotivationStatus;
  /** 最後の記録から今日までの日数 */
  daysSinceLast: number;
}

// 定着度（日）: 値が約37%まで下がるのにかかる日数の目安
const INITIAL_STABILITY = 3;
const MAX_STABILITY = 21;
const STABILITY_GROWTH = 2;
// この日数以内に次の記録があれば「続けている」とみなして定着度を伸ばす
const KEEP_UP_GAP_DAYS = 3;
// この日数を超えて空いたら定着度を半分に落とす
const LAPSE_GAP_DAYS = 7;
// 負荷量が0の日（有酸素のみ等）でも、記録したこと自体は評価する
const MIN_INTENSITY = 0.3;

// 跳ね上がった点を置く時刻のずらし幅。曲線補間は同じ時刻の2点を扱えないため、
// 記録日の0時（下がった値）から少し後ろにずらして、急だが滑らかな立ち上がりにする
const RISE_OFFSET_MS = 12 * 60 * 60 * 1000;
// 1回の記録で埋める「100までの残り」の割合の上限。1回で急に戻らず、続けるほど積み上がるようにする
const BOOST_RATE = 0.5;

const GOOD_THRESHOLD = 70;
export const WARNING_THRESHOLD = 40;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** 日付ごとの負荷量（重量×回数×セット数）を集計する */
function sumVolumeByDate(records: TrainingRecord[]): Map<string, number> {
  const volumes = new Map<string, number>();
  for (const r of records) {
    volumes.set(r.date, (volumes.get(r.date) ?? 0) + r.weight * r.reps * r.sets);
  }
  return volumes;
}

/** 負荷量が0より大きい日の平均（自分の普段の負荷量）を求める */
function averagePositiveVolume(volumes: Map<string, number>): number {
  const positives = Array.from(volumes.values()).filter((v) => v > 0);
  if (positives.length === 0) return 0;
  return positives.reduce((sum, v) => sum + v, 0) / positives.length;
}

/** その日の濃さ（0.3〜1）。自分の平均負荷量に対する割合で、平均以上は1とする */
export function calcIntensity(volume: number, averageVolume: number): number {
  if (averageVolume <= 0 || volume <= 0) return MIN_INTENSITY;
  const ratio = Math.min(1, volume / averageVolume);
  return MIN_INTENSITY + (1 - MIN_INTENSITY) * ratio;
}

/** 前回からの間隔と濃さに応じて、定着度を更新する */
export function updateStability(stability: number, gapDays: number, intensity: number): number {
  if (gapDays <= KEEP_UP_GAP_DAYS) {
    return Math.min(MAX_STABILITY, stability + STABILITY_GROWTH * intensity);
  }
  if (gapDays > LAPSE_GAP_DAYS) {
    return Math.max(INITIAL_STABILITY, stability / 2);
  }
  return stability;
}

export function toMotivationStatus(level: number): MotivationStatus {
  if (level >= GOOD_THRESHOLD) return 'good';
  if (level >= WARNING_THRESHOLD) return 'steady';
  return 'warning';
}

/**
 * 最初の記録日から today まで1日ずつ値を計算する。
 * 記録した日は「下がった後の値（0時）」と「跳ね上がった後の値（12時間後）」の2点を置き、
 * グラフ上で急に立ち上がる忘却曲線の形にする。記録がなければ null を返す。
 */
export function calcMotivation(records: TrainingRecord[], today: string): MotivationResult | null {
  const volumes = sumVolumeByDate(records);
  if (volumes.size === 0) return null;

  const averageVolume = averagePositiveVolume(volumes);
  const firstDate = Array.from(volumes.keys()).sort()[0];
  const endTime = Math.max(parseLocalDate(today), ...Array.from(volumes.keys()).map(parseLocalDate));

  const points: MotivationPoint[] = [];
  let level = 0;
  let stability = INITIAL_STABILITY;
  let lastSessionTime: number | null = null;

  const cursor = new Date(parseLocalDate(firstDate));
  while (cursor.getTime() <= endTime) {
    const date = toDateStr(cursor);
    const time = cursor.getTime();

    // 前日からの忘却（初日は下がる前の値がないので飛ばす）
    if (points.length > 0) {
      level *= Math.exp(-1 / stability);
    }

    const volume = volumes.get(date);
    if (volume !== undefined) {
      const intensity = calcIntensity(volume, averageVolume);
      if (lastSessionTime !== null) {
        const gapDays = Math.round((time - lastSessionTime) / (24 * 60 * 60 * 1000));
        stability = updateStability(stability, gapDays, intensity);
        points.push({ date, time, level: round1(level), isSession: false });
      }
      level += (100 - level) * intensity * BOOST_RATE;
      lastSessionTime = time;
      points.push({ date, time: time + RISE_OFFSET_MS, level: round1(level), isSession: true });
    } else {
      points.push({ date, time, level: round1(level), isSession: false });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  const current = points[points.length - 1].level;
  const daysSinceLast = Math.round((parseLocalDate(today) - (lastSessionTime ?? 0)) / (24 * 60 * 60 * 1000));

  return { points, current, status: toMotivationStatus(current), daysSinceLast: Math.max(0, daysSinceLast) };
}
