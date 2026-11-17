import type { ProteinIntake, TrainingRecord } from '../types';
import { PROTEIN_SCOOP_G, PROTEIN_TARGET_CUPS } from '../constants/protein';

export interface ProteinMeter {
  /** メーターの右端の値（g）。目安と合計の大きい方 */
  max: number;
  /** すでに飲んだ量・今回の量・目安の位置（いずれもメーター全体に対する %） */
  consumedPercent: number;
  addingPercent: number;
  targetPercent: number;
  /** 今回を含めた合計（g） */
  total: number;
  /** 目安まであと何g か（超えていれば 0） */
  remaining: number;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** つまみの割合（1杯のうち 0〜1）を g に変換する（例: 0.7 → 21g） */
export function ratioToGrams(ratio: number): number {
  return round1(Math.min(1, Math.max(0, ratio)) * PROTEIN_SCOOP_G);
}

/** 日付ごとの摂取量の合計（g） */
export function sumProteinByDate(intakes: ProteinIntake[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const intake of intakes) {
    totals.set(intake.date, round1((totals.get(intake.date) ?? 0) + intake.amount_g));
  }
  return totals;
}

/** その日に筋トレの記録があるか */
export function hasTrainingOn(records: TrainingRecord[], date: string): boolean {
  return records.some((r) => r.date === date);
}

/** その日に飲むべき量の目安（g）。筋トレした日は2杯、休みの日は1杯 */
export function dailyProteinTarget(records: TrainingRecord[], date: string): number {
  const cups = hasTrainingOn(records, date) ? PROTEIN_TARGET_CUPS.training : PROTEIN_TARGET_CUPS.rest;
  return cups * PROTEIN_SCOOP_G;
}

/**
 * 1本のメーターに「飲んだ量」「今回の量」「目安の線」を重ねて表示するための値を計算する。
 * 合計が目安を超えたときは、超えた分も見えるようにメーターの右端を合計に合わせる。
 */
export function buildProteinMeter(consumed: number, adding: number, target: number): ProteinMeter {
  const total = round1(consumed + adding);
  const max = Math.max(target, total, 1);
  const percent = (value: number) => Math.round((value / max) * 1000) / 10;

  return {
    max,
    consumedPercent: percent(consumed),
    addingPercent: percent(adding),
    targetPercent: percent(target),
    total,
    remaining: round1(Math.max(0, target - total)),
  };
}
