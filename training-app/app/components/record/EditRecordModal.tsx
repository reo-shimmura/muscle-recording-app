import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import ExerciseSelect from './ExerciseSelect';
import { buildExerciseCategoryMap, CARDIO_CATEGORY } from '../../constants/exercises';
import type { CustomExercise, TrainingRecord, AlertMessage } from '../../types';

interface Props {
  record: TrainingRecord;
  customExercises: string[];
  customExercisesWithCategory: CustomExercise[];
  loading: boolean;
  onSave: (id: number, updated: TrainingRecord) => Promise<boolean>;
  onSaveExercise: (name: string, category: string) => Promise<void>;
  onCancel: () => void;
  showMessage: (msg: AlertMessage) => void;
}

/** 記録編集モーダル：日付・種目・数値・メモを自由に更新する */
export default function EditRecordModal({
  record,
  customExercises,
  customExercisesWithCategory,
  loading,
  onSave,
  onSaveExercise,
  onCancel,
  showMessage,
}: Props) {
  const [date, setDate] = useState(record.date);
  const [exercise, setExercise] = useState(record.exercise);
  const [exerciseNew, setExerciseNew] = useState('');
  const [exerciseNewCategory, setExerciseNewCategory] = useState('');
  const [weight, setWeight] = useState(record.weight);
  const [reps, setReps] = useState(record.reps);
  const [sets, setSets] = useState(record.sets);
  const [durationMinutes, setDurationMinutes] = useState(record.duration_minutes ?? 0);
  const [memo, setMemo] = useState(record.memo);

  const categoryMap = useMemo(
    () => buildExerciseCategoryMap(customExercisesWithCategory),
    [customExercisesWithCategory]
  );
  // 新規種目入力中はそのカテゴリ、既存種目選択中はマスタのカテゴリで判定する
  // カテゴリが不明な場合は編集前の記録が有酸素だったかどうかを引き継ぐ
  const activeCategory = exerciseNew.trim() ? exerciseNewCategory.trim() : (categoryMap[exercise] ?? '');
  const isCardio = activeCategory
    ? activeCategory === CARDIO_CATEGORY
    : record.duration_minutes != null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedExercise = exerciseNew.trim() || exercise.trim();
    if (!resolvedExercise) {
      showMessage({ type: 'error', text: '種目を選択または入力してください。' });
      return;
    }
    if (isCardio && durationMinutes <= 0) {
      showMessage({ type: 'error', text: '時間（分）を入力してください。' });
      return;
    }

    const updated: TrainingRecord = isCardio
      ? {
          ...record,
          date,
          exercise: resolvedExercise,
          weight: 0,
          reps: 0,
          sets: 0,
          duration_minutes: durationMinutes,
          memo: memo.trim(),
        }
      : {
          ...record,
          date,
          exercise: resolvedExercise,
          weight: Math.max(0, weight),
          reps: Math.max(1, reps),
          sets: Math.max(1, sets),
          duration_minutes: null,
          memo: memo.trim(),
        };

    const success = await onSave(record.id ?? 0, updated);
    if (!success) return;

    if (exerciseNew.trim() && exerciseNewCategory.trim()) {
      await onSaveExercise(exerciseNew.trim(), exerciseNewCategory.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>記録を編集</h3>
        <form onSubmit={handleSubmit}>
          <ExerciseSelect
            value={exercise}
            newValue={exerciseNew}
            newCategory={exerciseNewCategory}
            customExercises={customExercises}
            customExercisesWithCategory={customExercisesWithCategory}
            onSelectChange={setExercise}
            onNewValueChange={setExerciseNew}
            onNewCategoryChange={setExerciseNewCategory}
          />

          <div className="element-container">
            <label>日付</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {isCardio ? (
            <div className="element-container">
              <label>時間（分）</label>
              <input
                type="number"
                min="0"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                required
              />
            </div>
          ) : (
            <div className="element-container">
              <label>重量・回数・セット数</label>
              <div className="row">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  placeholder="重量(kg)"
                  required
                />
                <input
                  type="number"
                  min="1"
                  value={reps}
                  onChange={(e) => setReps(Number(e.target.value))}
                  placeholder="回数"
                  required
                />
                <input
                  type="number"
                  min="1"
                  value={sets}
                  onChange={(e) => setSets(Number(e.target.value))}
                  placeholder="セット数"
                  required
                />
              </div>
            </div>
          )}

          <div className="element-container">
            <label>メモ（任意）</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="トレーニングの感覚、調整内容など"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <span className="spinner"></span> : '✅'} 保存
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
