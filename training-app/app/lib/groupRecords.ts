import type { TrainingRecord } from '../types';

export interface ExerciseGroup {
  exercise: string;
  records: TrainingRecord[];
}

/** 同じ種目の記録を1ブロックにまとめる（登場順を維持） */
export function groupRecordsByExercise(records: TrainingRecord[]): ExerciseGroup[] {
  const groups: ExerciseGroup[] = [];
  for (const r of records) {
    const group = groups.find((g) => g.exercise === r.exercise);
    if (group) {
      group.records.push(r);
    } else {
      groups.push({ exercise: r.exercise, records: [r] });
    }
  }
  return groups;
}
