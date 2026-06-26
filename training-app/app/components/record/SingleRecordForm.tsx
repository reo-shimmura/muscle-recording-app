import { useState } from 'react';
import ExerciseSelect from './ExerciseSelect';
import WorkoutSetList from './WorkoutSetList';
import type { TrainingRecord, AlertMessage } from '../../types';

interface Props {
  customExercises: string[];
  loading: boolean;
  onSave: (records: TrainingRecord[]) => Promise<boolean>;
  showMessage: (msg: AlertMessage) => void;
}

/** 単体登録フォーム：種目・日付・セット一覧・メモを入力して1種目分を登録 */
export default function SingleRecordForm({ customExercises, loading, onSave, showMessage }: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [exercise, setExercise] = useState('');
  const [exerciseNew, setExerciseNew] = useState('');
  const [memo, setMemo] = useState('');
  const [sets, setSets] = useState<{ weight: number; reps: number }[]>([{ weight: 0, reps: 1 }]);

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

    const payloads: TrainingRecord[] = sets.map((s) => ({
      date,
      exercise: resolvedExercise,
      weight: Math.max(0, s.weight),
      reps: Math.max(1, s.reps),
      sets: 1,
      memo: memo.trim(),
    }));

    const success = await onSave(payloads);
    if (!success) return;

    setExercise('');
    setExerciseNew('');
    setMemo('');
    setSets([{ weight: 0, reps: 1 }]);
  };

  return (
    <form onSubmit={handleSubmit}>
      <ExerciseSelect
        value={exercise}
        newValue={exerciseNew}
        customExercises={customExercises}
        onSelectChange={setExercise}
        onNewValueChange={setExerciseNew}
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

      <WorkoutSetList
        sets={sets}
        onSetChange={handleSetChange}
        onSetDelete={handleSetDelete}
        onSetAdd={handleSetAdd}
      />

      <div className="element-container">
        <label>メモ（任意）</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="トレーニングの感覚、調整内容など"
        />
      </div>

      <div className="element-container">
        <button type="submit" disabled={loading}>
          {loading ? <span className="spinner"></span> : '✨'} 記録する
        </button>
      </div>
    </form>
  );
}
