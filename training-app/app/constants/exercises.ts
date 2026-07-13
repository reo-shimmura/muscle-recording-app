import type { CustomExercise } from '../types';

export const UNCATEGORIZED_LABEL = 'その他';

// このカテゴリの種目は重量×回数×セットではなく、時間（分）で記録する
export const CARDIO_CATEGORY = '有酸素';

export const DEFAULT_EXERCISES: Record<string, string[]> = {
  胸: ['ベンチプレス', 'チェストプレス'],
  背中: ['ラットプルダウン', 'シーテッドロー', 'フェイスプル', 'デッドリフト'],
  脚: ['スクワット', 'レッグプレス', 'ブルガリアンスクワット', 'ヒップスラスト', 'レッグカール', 'レッグエクステンション', 'カーフレイズ'],
  肩: ['ショルダープレス', 'サイドレイズ'],
  腕: ['インクラインダンベルカール', 'プリーチャーカール', 'トライセプスプレスダウン'],
  腹筋: ['デッドバグ', 'バードドッグ', 'プランク', 'レッグレイズ', 'ロシアンツイスト', '上体起こし'],
  有酸素: ['ランニング'],
};

export const DEFAULT_EXERCISE_SET = new Set(Object.values(DEFAULT_EXERCISES).flat());

/** 種目名 → カテゴリ名 のマップを作成する（デフォルト種目 + カスタム種目を統合） */
export function buildExerciseCategoryMap(
  customExercisesWithCategory: CustomExercise[]
): Record<string, string> {
  const map: Record<string, string> = {};

  for (const [category, names] of Object.entries(DEFAULT_EXERCISES)) {
    for (const name of names) {
      map[name] = category;
    }
  }
  for (const ex of customExercisesWithCategory) {
    map[ex.name] = ex.category;
  }

  return map;
}
