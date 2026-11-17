'use client'

import { useCallback, useMemo, useState } from 'react';
import { UNCATEGORIZED_LABEL } from '../constants/exercises';
import type { TrainingRecord } from '../types';

// 「すべて」を表す選択値
export const ALL_VALUE = '';

interface UseExerciseFilterReturn {
  category: string;
  exercise: string;
  /** カテゴリを変える（別カテゴリの種目が選ばれたままにならないよう、種目はリセットする） */
  setCategory: (value: string) => void;
  setExercise: (value: string) => void;
  /** 記録に登場するカテゴリの一覧 */
  categories: string[];
  /** 選択中のカテゴリに属する種目の一覧 */
  exerciseOptions: string[];
  /** カテゴリ・種目で絞り込んだ記録 */
  filteredRecords: TrainingRecord[];
  /** 種目名からカテゴリを引く（未登録の種目は「その他」） */
  categoryOf: (exercise: string) => string;
}

/** 統計・分析と記録詳細で共通の、カテゴリ・種目による記録の絞り込み */
export function useExerciseFilter(records: TrainingRecord[], categoryMap: Record<string, string>): UseExerciseFilterReturn {
  const [category, setCategoryValue] = useState(ALL_VALUE);
  const [exercise, setExercise] = useState(ALL_VALUE);

  const categoryOf = useCallback(
    (exerciseName: string) => categoryMap[exerciseName] ?? UNCATEGORIZED_LABEL,
    [categoryMap]
  );

  const categories = useMemo(
    () => Array.from(new Set(records.map((r) => categoryOf(r.exercise)))).sort(),
    [records, categoryOf]
  );

  const exerciseOptions = useMemo(() => {
    const scoped = records.filter((r) => !category || categoryOf(r.exercise) === category);
    return Array.from(new Set(scoped.map((r) => r.exercise))).sort();
  }, [records, category, categoryOf]);

  const filteredRecords = useMemo(
    () =>
      records.filter((r) => {
        if (category && categoryOf(r.exercise) !== category) return false;
        if (exercise && r.exercise !== exercise) return false;
        return true;
      }),
    [records, category, exercise, categoryOf]
  );

  const setCategory = useCallback((value: string) => {
    setCategoryValue(value);
    setExercise(ALL_VALUE);
  }, []);

  return { category, exercise, setCategory, setExercise, categories, exerciseOptions, filteredRecords, categoryOf };
}
