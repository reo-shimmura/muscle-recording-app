'use client'

import { useEffect, useState, useCallback } from 'react';
import TabNav from './components/TabNav';
import AlertMessage from './components/AlertMessage';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import RecordTab from './components/record/RecordTab';
import GoalsTab from './components/goals/GoalsTab';
import CalendarTab from './components/calendar/CalendarTab';
import DetailsTab from './components/details/DetailsTab';
import { useTrainingData } from './hooks/useTrainingData';
import { DEFAULT_EXERCISES, DEFAULT_EXERCISE_SET } from './constants/exercises';
import type { CustomExercise, Goal, TrainingRecord, ProgressImage, AlertMessage as AlertMessageType } from './types';

const MAIN_TABS = [
  { id: 'write', label: '📝 記録追加' },
  { id: 'goals', label: '🎯 目標管理' },
  { id: 'calendar', label: '📅 カレンダー' },
  { id: 'details', label: '📊 統計・記録詳細' },
];

export default function Home() {
  const [tab, setTab] = useState<string>('write');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [message, setMessage] = useState<AlertMessageType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [customExercisesWithCategory, setCustomExercisesWithCategory] = useState<CustomExercise[]>([]);

  const showMessage = useCallback((msg: AlertMessageType) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 4000);
  }, []);

  const { records, images, loading, setRecords, setImages, fetchData } = useTrainingData(showMessage);

  const fetchExercises = useCallback(async () => {
    try {
      const res = await fetch('/api/exercises');
      if (!res.ok) throw new Error(`Fetch exercises failed: ${res.status}`);
      const data: CustomExercise[] = await res.json();
      setCustomExercisesWithCategory(data);
    } catch (err) {
      console.error('exercises fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchExercises();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // exercisesテーブルに登録済みの種目名セット
  const exerciseNamesWithCategory = new Set(customExercisesWithCategory.map((e) => e.name));

  // デフォルト種目にもexercisesテーブルにもない記録済み種目（レガシーカスタム）
  const customExercises = Array.from(
    new Set(
      records
        .map((r) => r.exercise)
        .filter((ex) => ex && !DEFAULT_EXERCISE_SET.has(ex) && !exerciseNamesWithCategory.has(ex))
    )
  ).sort();

  const allExercisesFlat = [
    ...Object.values(DEFAULT_EXERCISES).flat(),
    ...customExercisesWithCategory.map((e) => e.name),
    ...customExercises,
  ];

  const handleSaveRecords = async (payloads: TrainingRecord[]): Promise<boolean> => {
    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloads),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      const data: TrainingRecord[] = await res.json();
      setRecords((prev) => [...data, ...prev]);
      showMessage({ type: 'success', text: `✅ ${payloads.length}セットを記録しました！` });
      setTab('details');
      return true;
    } catch (err: unknown) {
      console.error('Save failed:', err instanceof Error ? err.message : err);
      showMessage({ type: 'error', text: '記録の保存に失敗しました。' });
      return false;
    }
  };

  const handleSaveExercise = async (name: string, category: string): Promise<void> => {
    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category }),
      });
      if (!res.ok) throw new Error(`Save exercise failed: ${res.status}`);
      await fetchExercises();
    } catch (err: unknown) {
      console.error('Save exercise failed:', err instanceof Error ? err.message : err);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    try {
      const res = await fetch(`/api/records/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setDeleteConfirm(null);
      showMessage({ type: 'success', text: '記録を削除しました。' });
    } catch (err: unknown) {
      console.error('Delete failed:', err instanceof Error ? err.message : err);
      showMessage({ type: 'error', text: '削除に失敗しました。' });
    }
  };

  const handleImageUpload = (image: ProgressImage) => {
    setImages((prev) => [image, ...prev]);
  };

  const addGoal = (g: Goal) => setGoals((prev) => [...prev, { ...g, id: Date.now() }]);

  return (
    <div>
      <div className="card">
        {message && <AlertMessage message={message} />}

        <TabNav tabs={MAIN_TABS} activeTab={tab} onTabChange={setTab} />

        {tab === 'write' && (
          <RecordTab
            customExercises={customExercises}
            customExercisesWithCategory={customExercisesWithCategory}
            allExercisesFlat={allExercisesFlat}
            loading={loading}
            onSave={handleSaveRecords}
            onSaveExercise={handleSaveExercise}
            showMessage={showMessage}
          />
        )}

        {tab === 'goals' && (
          <GoalsTab
            goals={goals}
            allExercisesFlat={allExercisesFlat}
            onAddGoal={addGoal}
          />
        )}

        {tab === 'calendar' && (
          <CalendarTab
            records={records}
            images={images}
            onImageUpload={handleImageUpload}
            showMessage={showMessage}
          />
        )}

        {tab === 'details' && (
          <DetailsTab
            records={records}
            customExercisesWithCategory={customExercisesWithCategory}
            onDeleteRequest={setDeleteConfirm}
          />
        )}
      </div>

      {deleteConfirm !== null && (
        <DeleteConfirmModal
          loading={loading}
          onConfirm={() => handleDeleteRecord(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
