import type { TrainingRecord } from '../../types';
import { CARDIO_CATEGORY, DEFAULT_EXERCISES } from '../../constants/exercises';
import { categoryOf, isStrengthRecord, volumeOf } from './common';

export interface CategoryBalance {
  category: string;
  volume: number;
  sets: number;
  /** その部位を鍛えた日数 */
  days: number;
}

export type PushPullVerdict = 'push-heavy' | 'pull-heavy' | 'balanced' | 'insufficient';

export interface PushPullBalance {
  /** 押す種目（胸・肩）の負荷量 */
  push: number;
  /** 引く種目（背中）の負荷量 */
  pull: number;
  /** 押す ÷ 引く（小数第2位まで）。どちらかが0なら null */
  ratio: number | null;
  verdict: PushPullVerdict;
}

// 筋トレの部位（有酸素以外）。記録がない部位も 0 で表示するために使う
const STRENGTH_CATEGORIES = Object.keys(DEFAULT_EXERCISES).filter((c) => c !== CARDIO_CATEGORY);

export const PUSH_CATEGORIES = ['胸', '肩'];
export const PULL_CATEGORIES = ['背中'];

// 押す÷引く がこの範囲なら「良好」とする
const BALANCED_MIN = 0.67;
const BALANCED_MAX = 1.5;

/**
 * 部位ごとの負荷量・セット数・実施日数を集計する（有酸素は除く）。
 * startDate 以降の記録が対象（null なら全期間）。デフォルトの部位は記録がなくても 0 で含め、
 * カスタムのカテゴリは記録がある場合のみ後ろに足す。
 */
export function summarizeByCategory(
  records: TrainingRecord[],
  categoryMap: Record<string, string>,
  startDate: string | null
): CategoryBalance[] {
  const totals = new Map<string, { volume: number; sets: number; dates: Set<string> }>(
    STRENGTH_CATEGORIES.map((c) => [c, { volume: 0, sets: 0, dates: new Set<string>() }])
  );

  for (const r of records) {
    if (startDate !== null && r.date < startDate) continue;
    if (!isStrengthRecord(r, categoryMap)) continue;
    const category = categoryOf(r.exercise, categoryMap);
    const total = totals.get(category) ?? { volume: 0, sets: 0, dates: new Set<string>() };
    total.volume += volumeOf(r);
    total.sets += r.sets;
    total.dates.add(r.date);
    totals.set(category, total);
  }

  return Array.from(totals.entries()).map(([category, t]) => ({
    category,
    volume: t.volume,
    sets: t.sets,
    days: t.dates.size,
  }));
}

/** 押す種目（胸・肩）と引く種目（背中）の負荷量の比率を求め、偏りを判定する */
export function calcPushPullBalance(balances: CategoryBalance[]): PushPullBalance {
  const sumOf = (categories: string[]) =>
    balances.filter((b) => categories.includes(b.category)).reduce((sum, b) => sum + b.volume, 0);
  const push = sumOf(PUSH_CATEGORIES);
  const pull = sumOf(PULL_CATEGORIES);

  if (push === 0 || pull === 0) {
    return { push, pull, ratio: null, verdict: push === 0 && pull === 0 ? 'insufficient' : push === 0 ? 'pull-heavy' : 'push-heavy' };
  }

  const ratio = Math.round((push / pull) * 100) / 100;
  const verdict: PushPullVerdict = ratio > BALANCED_MAX ? 'push-heavy' : ratio < BALANCED_MIN ? 'pull-heavy' : 'balanced';
  return { push, pull, ratio, verdict };
}
