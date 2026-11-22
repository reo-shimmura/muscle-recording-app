import type { BodyWeight, FoodIntake, TrainingRecord } from '../types';
import { PROTEIN_SCOOP_G, PROTEIN_TARGET_G_PER_KG } from '../constants/protein';
import { PROTEIN_POWDER_KEY } from '../constants/foods';

export interface ProteinTarget {
  /** その日のたんぱく質の目安（g） */
  grams: number;
  /** 計算に使った体重（kg）と、その記録日 */
  bodyWeightKg: number;
  bodyWeightDate: string;
  /** 体重1kgあたりの係数（筋トレした日 2.0 / 休みの日 1.6） */
  gramsPerKg: number;
  trained: boolean;
}

export interface ProteinMeter {
  /** メーターの右端の値（g）。目安と合計の大きい方 */
  max: number;
  /** すでに摂った量・今回の量・目安の位置（いずれもメーター全体に対する %）。目安がなければ targetPercent は null */
  consumedPercent: number;
  addingPercent: number;
  targetPercent: number | null;
  /** 今回を含めた合計（g） */
  total: number;
  /** 目安まであと何g か（超えていれば 0、目安がなければ null） */
  remaining: number | null;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** つまみの割合（1杯のうち 0〜1）をプロテインの粉の g に変換する（例: 0.7 → 21g） */
export function ratioToGrams(ratio: number): number {
  return round1(Math.min(1, Math.max(0, ratio)) * PROTEIN_SCOOP_G);
}

/** 日付ごとのたんぱく質の合計（g）。プロテインも食事もまとめて数える */
export function sumProteinByDate(intakes: FoodIntake[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const intake of intakes) {
    totals.set(intake.date, round1((totals.get(intake.date) ?? 0) + intake.protein_g));
  }
  return totals;
}

/** プロテイン（粉）を飲んだ記録だけを取り出す（習慣目標「プロテイン摂取」で使う） */
export function powderIntakes(intakes: FoodIntake[]): FoodIntake[] {
  return intakes.filter((intake) => intake.food_key === PROTEIN_POWDER_KEY);
}

/** その日に筋トレの記録があるか */
export function hasTrainingOn(records: TrainingRecord[], date: string): boolean {
  return records.some((r) => r.date === date);
}

/** その日までで最も新しい体重の記録（その日より後の記録は使わない）。なければ null */
export function bodyWeightOn(bodyWeights: BodyWeight[], date: string): BodyWeight | null {
  return bodyWeights.reduce<BodyWeight | null>(
    (latest, bw) => (bw.date <= date && (latest === null || bw.date > latest.date) ? bw : latest),
    null
  );
}

/**
 * その日のたんぱく質の目安（g）。最新の体重 × 体重1kgあたりの係数（筋トレした日 2.0 / 休みの日 1.6）。
 * その日までに体重の記録がなければ計算できないので null。
 */
export function dailyProteinTarget(
  records: TrainingRecord[],
  bodyWeights: BodyWeight[],
  date: string
): ProteinTarget | null {
  const bodyWeight = bodyWeightOn(bodyWeights, date);
  if (!bodyWeight) return null;
  const trained = hasTrainingOn(records, date);
  const gramsPerKg = trained ? PROTEIN_TARGET_G_PER_KG.training : PROTEIN_TARGET_G_PER_KG.rest;
  return {
    grams: Math.round(bodyWeight.weight_kg * gramsPerKg),
    bodyWeightKg: bodyWeight.weight_kg,
    bodyWeightDate: bodyWeight.date,
    gramsPerKg,
    trained,
  };
}

/**
 * 1本のメーターに「摂った量」「今回の量」「目安の線」を重ねて表示するための値を計算する。
 * 合計が目安を超えたときは、超えた分も見えるようにメーターの右端を合計に合わせる。
 * 目安がない（体重が未記録）ときは、合計だけを表示できるようにする。
 */
export function buildProteinMeter(consumed: number, adding: number, target: number | null): ProteinMeter {
  const total = round1(consumed + adding);
  const max = Math.max(target ?? 0, total, 1);
  const percent = (value: number) => Math.round((value / max) * 1000) / 10;

  return {
    max,
    consumedPercent: percent(consumed),
    addingPercent: percent(adding),
    targetPercent: target === null ? null : percent(target),
    total,
    remaining: target === null ? null : round1(Math.max(0, target - total)),
  };
}
