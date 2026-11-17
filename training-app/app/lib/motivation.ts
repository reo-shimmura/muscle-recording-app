/**
 * モチベーション（継続度）の推移を計算する。
 *
 * 上がり方
 * - 記録した日を基準に、直近7日で3日以上記録していれば「継続中」とみなす（週3回が基準）
 * - 継続していない日の記録は少しだけ上がる（0 から1回記録しても 5 まで）
 * - 継続中は、最初は上がりづらく、継続が約1か月を超えると1回あたりの上がり幅が増えていく
 *   （週3回を続けると、1週間で約13、1か月で約43、2か月で約80、3か月でほぼ100）
 *
 * 下がり方
 * - 記録が途切れると、最初はゆっくり、日が経つほど急に下がる
 * - 高いときほど下がりにくい（100 からは14日で0、0 付近からは7日で0）
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
  /** 記録した日なら true（上がった後の点） */
  isSession: boolean;
}

export type MotivationStatus = 'good' | 'steady' | 'warning';

export interface MotivationResult {
  points: MotivationPoint[];
  current: number;
  status: MotivationStatus;
  /** 最後の記録から今日までの日数 */
  daysSinceLast: number;
  /** 今日を含む直近7日で記録した日数 */
  recentSessions: number;
  /** 継続中なら継続日数（何日目か）、継続していなければ null */
  continuousDays: number | null;
}

/** 継続とみなす基準：直近 CONTINUITY_WINDOW_DAYS 日で CONTINUITY_MIN_SESSIONS 日以上 */
export const CONTINUITY_WINDOW_DAYS = 7;
export const CONTINUITY_MIN_SESSIONS = 3;

// 1回の記録で上がる量
const NON_CONTINUOUS_GAIN = 5; // 継続していないとき
const CONTINUOUS_MIN_GAIN = 5; // 継続し始め
const CONTINUOUS_MAX_GAIN = 8; // 継続が長く続いたとき
// 上がり幅が増え始める・最大になる継続日数（シミュレーションで目安に合わせた値）
const GAIN_RAMP_START_DAYS = 28;
const GAIN_RAMP_END_DAYS = 84;

// 記録が途切れてから 0 になるまでの日数（値が 0 付近なら7日、100 なら14日）
const MIN_FADE_DAYS = 7;
const MAX_FADE_DAYS = 14;

// 上がった点を置く時刻のずらし幅。曲線補間は同じ時刻の2点を扱えないため、
// 記録日の0時（下がった値）から少し後ろにずらして、急だが滑らかな立ち上がりにする
const RISE_OFFSET_MS = 12 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const MAX_LEVEL = 100;
const GOOD_THRESHOLD = 70;
export const WARNING_THRESHOLD = 40;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** 0〜1 を滑らかにつなぐ（始まりと終わりがなだらかな S 字） */
function smoothStep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** 記録時の値に応じて、0 まで下がるのにかかる日数（高いほど長い） */
export function fadeDays(levelAtSession: number): number {
  const ratio = Math.min(MAX_LEVEL, Math.max(0, levelAtSession)) / MAX_LEVEL;
  return MIN_FADE_DAYS + (MAX_FADE_DAYS - MIN_FADE_DAYS) * ratio;
}

/** 最後に記録したときの値から、days 日経ったときの値（最初はゆっくり、後半ほど急に下がる） */
export function decayLevel(levelAtSession: number, days: number): number {
  if (days <= 0) return levelAtSession;
  const progress = days / fadeDays(levelAtSession);
  return Math.max(0, levelAtSession * (1 - progress * progress));
}

/**
 * 1回の記録で上がる量。
 * continuousDays は継続中なら継続日数（0 = 継続し始めた日）、継続していなければ null。
 */
export function sessionGain(continuousDays: number | null): number {
  if (continuousDays === null) return NON_CONTINUOUS_GAIN;
  const ramp = smoothStep((continuousDays - GAIN_RAMP_START_DAYS) / (GAIN_RAMP_END_DAYS - GAIN_RAMP_START_DAYS));
  return CONTINUOUS_MIN_GAIN + (CONTINUOUS_MAX_GAIN - CONTINUOUS_MIN_GAIN) * ramp;
}

export function toMotivationStatus(level: number): MotivationStatus {
  if (level >= GOOD_THRESHOLD) return 'good';
  if (level >= WARNING_THRESHOLD) return 'steady';
  return 'warning';
}

/** day を含む直近7日で、記録した日数を数える */
function countRecentSessions(sessionDates: Set<string>, day: Date): number {
  let count = 0;
  const cursor = new Date(day);
  for (let i = 0; i < CONTINUITY_WINDOW_DAYS; i++) {
    if (sessionDates.has(toDateStr(cursor))) count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

/**
 * 最初の記録日から today まで1日ずつ値を計算する。
 * 記録した日は「下がった後の値（0時）」と「上がった後の値（12時間後）」の2点を置く。
 * 今日より後の日付の記録は含めない。今日までに記録がなければ null を返す。
 */
export function calcMotivation(records: TrainingRecord[], today: string): MotivationResult | null {
  const sessionDates = new Set(records.map((r) => r.date).filter((date) => date <= today));
  if (sessionDates.size === 0) return null;

  const sortedDates = Array.from(sessionDates).sort();
  const endTime = parseLocalDate(today);

  const points: MotivationPoint[] = [];
  let levelAtSession = 0;
  let lastSessionTime: number | null = null;
  let continuityStartTime: number | null = null;
  let recentSessions = 0;

  const cursor = new Date(parseLocalDate(sortedDates[0]));
  while (cursor.getTime() <= endTime) {
    const date = toDateStr(cursor);
    const time = cursor.getTime();

    // 継続の判定（直近7日で3日以上）。基準を下回ったら継続日数をリセットする
    recentSessions = countRecentSessions(sessionDates, cursor);
    if (recentSessions < CONTINUITY_MIN_SESSIONS) continuityStartTime = null;
    else if (continuityStartTime === null) continuityStartTime = time;

    const decayed = lastSessionTime === null ? 0 : decayLevel(levelAtSession, Math.round((time - lastSessionTime) / DAY_MS));

    if (sessionDates.has(date)) {
      const continuousDays = continuityStartTime === null ? null : Math.round((time - continuityStartTime) / DAY_MS);
      if (lastSessionTime !== null) points.push({ date, time, level: round1(decayed), isSession: false });
      levelAtSession = Math.min(MAX_LEVEL, decayed + sessionGain(continuousDays));
      lastSessionTime = time;
      points.push({ date, time: time + RISE_OFFSET_MS, level: round1(levelAtSession), isSession: true });
    } else {
      points.push({ date, time, level: round1(decayed), isSession: false });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  const current = points[points.length - 1].level;
  const daysSinceLast = Math.max(0, Math.round((parseLocalDate(today) - (lastSessionTime ?? 0)) / DAY_MS));
  const continuousDays =
    continuityStartTime === null ? null : Math.round((parseLocalDate(today) - continuityStartTime) / DAY_MS) + 1;

  return { points, current, status: toMotivationStatus(current), daysSinceLast, recentSessions, continuousDays };
}
