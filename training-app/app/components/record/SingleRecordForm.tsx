import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import ExerciseSelect from './ExerciseSelect';
import WorkoutSetList from './WorkoutSetList';
import { buildExerciseCategoryMap, CARDIO_CATEGORY } from '../../constants/exercises';
import type { CustomExercise, TrainingRecord, AlertMessage } from '../../types';

interface Props {
  customExercises: string[];
  customExercisesWithCategory: CustomExercise[];
  loading: boolean;
  onSave: (records: TrainingRecord[]) => Promise<boolean>;
  onSaveExercise: (name: string, category: string) => Promise<void>;
  showMessage: (msg: AlertMessage) => void;
}

/** 単体登録フォーム：種目・日付・セット一覧（有酸素種目は時間）・メモを入力して1種目分を登録 */
export default function SingleRecordForm({
  customExercises,
  customExercisesWithCategory,
  loading,
  onSave,
  onSaveExercise,
  showMessage,
}: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [exercise, setExercise] = useState('');
  const [exerciseNew, setExerciseNew] = useState('');
  const [exerciseNewCategory, setExerciseNewCategory] = useState('');
  const [memo, setMemo] = useState('');
  const [sets, setSets] = useState<{ weight: number; reps: number }[]>([{ weight: 0, reps: 1 }]);
  const [durationMinutes, setDurationMinutes] = useState(0);

  const categoryMap = useMemo(
    () => buildExerciseCategoryMap(customExercisesWithCategory),
    [customExercisesWithCategory]
  );
  // 新規種目入力中はそのカテゴリ、既存種目選択中はマスタのカテゴリで判定する
  const activeCategory = exerciseNew.trim() ? exerciseNewCategory.trim() : (categoryMap[exercise] ?? '');
  const isCardio = activeCategory === CARDIO_CATEGORY;

  const handleSetChange = (index: number, field: 'weight' | 'reps', value: number) => {
    setSets((prev) => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const handleSetDelete = (index: number) => {
    setSets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetAdd = () => {
    const last = sets[sets.length - 1];
    setSets((prev) => [...prev, { weight: last?.weight ?? 0, reps: last?.reps ?? 1 }]);
  };

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

    const payloads: TrainingRecord[] = isCardio
      ? [{
          date,
          exercise: resolvedExercise,
          weight: 0,
          reps: 0,
          sets: 0,
          duration_minutes: durationMinutes,
          memo: memo.trim(),
        }]
      : sets.map((s) => ({
          date,
          exercise: resolvedExercise,
          weight: Math.max(0, s.weight),
          reps: Math.max(1, s.reps),
          sets: 1,
          memo: memo.trim(),
        }));

    const success = await onSave(payloads);
    if (!success) return;

    // 新規種目かつカテゴリが指定されていれば保存
    if (exerciseNew.trim() && exerciseNewCategory.trim()) {
      await onSaveExercise(exerciseNew.trim(), exerciseNewCategory.trim());
    }

    setExercise('');
    setExerciseNew('');
    setExerciseNewCategory('');
    setMemo('');
    setSets([{ weight: 0, reps: 1 }]);
    setDurationMinutes(0);
  };

  return (
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
        <WorkoutSetList
          sets={sets}
          onSetChange={handleSetChange}
          onSetDelete={handleSetDelete}
          onSetAdd={handleSetAdd}
        />
      )}

      <div className="element-container">
        <label>メモ（任意）</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="トレーニングの感覚、調整内容など"
        />
      </div>

      <div className="element-container">
        <Button type="submit" disabled={loading}>
          {loading ? <span className="spinner"></span> : '✨'} 記録する
        </Button>
      </div>
    </form>
  );
}
