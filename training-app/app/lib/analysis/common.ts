/**
 * 分析機能で共通して使う小さな処理。
 * 日付は 'YYYY-MM-DD'（ローカル日付）の文字列で扱う。
 */
import type { TrainingRecord } from '../../types';
import { parseLocalDate } from '../chartTimeAxis';
import { toDateStr } from '../goalsProgress';
import { CARDIO_CATEGORY, UNCATEGORIZED_LABEL } from '../../constants/exercises';

const DAY_MS = 24 * 60 * 60 * 1000;

/** 1件の記録の負荷量（重量×回数×セット数） */
export function volumeOf(record: TrainingRecord): number {
  return record.weight * record.reps * record.sets;
}

/** 日付に日数を足す（負の値で過去へ） */
export function addDaysStr(date: string, days: number): string {
  const d = new Date(parseLocalDate(date));
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

/** from から to までの日数（to が後なら正） */
export function diffDaysStr(from: string, to: string): number {
  return Math.round((parseLocalDate(to) - parseLocalDate(from)) / DAY_MS);
}

/** 種目名からカテゴリを引く（未登録の種目は「その他」） */
export function categoryOf(exercise: string, categoryMap: Record<string, string>): string {
  return categoryMap[exercise] ?? UNCATEGORIZED_LABEL;
}

/** 筋トレ（有酸素以外）の記録かどうか。負荷量ベースの分析はこれだけを対象にする */
export function isStrengthRecord(record: TrainingRecord, categoryMap: Record<string, string>): boolean {
  return categoryOf(record.exercise, categoryMap) !== CARDIO_CATEGORY && record.duration_minutes == null;
}

/** 前の値に対する増減率（%）。前の値が0なら比較できないので null */
export function changeRate(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
