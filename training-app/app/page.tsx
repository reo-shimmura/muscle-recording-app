'use client'

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from './components/BottomNav';
import AlertMessage from './components/AlertMessage';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import HomeTab from './components/home/HomeTab';
import RecordTab from './components/record/RecordTab';
import EditRecordModal from './components/record/EditRecordModal';
import GoalsTab from './components/goals/GoalsTab';
import CalendarTab from './components/calendar/CalendarTab';
import StatsTab from './components/details/StatsTab';
import RecordsTab from './components/details/RecordsTab';
import { useTrainingData } from './hooks/useTrainingData';
import { useGoals } from './hooks/useGoals';
import { useBodyWeights } from './hooks/useBodyWeights';
import { useFoodIntakes } from './hooks/useFoodIntakes';
import { DEFAULT_EXERCISES, DEFAULT_EXERCISE_SET } from './constants/exercises';
import type { CustomExercise, TrainingRecord, AlertMessage as AlertMessageType } from './types';
import type { IconName } from './components/Icon';
import { NAV_COLORS } from './constants/colors';

const MAIN_TABS: { id: string; label: string; icon: IconName; color: string }[] = [
  { id: 'home', label: 'ホーム', icon: 'home', color: NAV_COLORS.home },
  { id: 'write', label: '記録追加', icon: 'pencil', color: NAV_COLORS.write },
  { id: 'goals', label: '目標管理', icon: 'target', color: NAV_COLORS.goals },
  { id: 'calendar', label: 'カレンダー', icon: 'calendar', color: NAV_COLORS.calendar },
  { id: 'stats', label: '統計・分析', icon: 'chart-up', color: NAV_COLORS.stats },
  { id: 'records', label: '記録詳細', icon: 'training-log', color: NAV_COLORS.records },
];

export default function Home() {
  const [tab, setTab] = useState<string>('home');
  const [message, setMessage] = useState<AlertMessageType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | null>(null);
  const [customExercisesWithCategory, setCustomExercisesWithCategory] = useState<CustomExercise[]>([]);

  const showMessage = useCallback((msg: AlertMessageType) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 4000);
  }, []);

  const { records, loading, setRecords, fetchData } = useTrainingData(showMessage);
  const {
    longTermGoals,
    weeklyGoal,
    monthlyGoals,
    habitGoals,
    fetchGoals,
    addLongTermGoal,
    deleteLongTermGoal,
    saveWeeklyGoal,
    saveMonthlyGoals,
    saveHabitGoals,
  } = useGoals(showMessage);
  const { bodyWeights, loading: bodyWeightLoading, fetchBodyWeights, saveBodyWeight, deleteBodyWeight } =
    useBodyWeights(showMessage);
  const { foodIntakes, loading: foodLoading, fetchFoodIntakes, saveFoodIntake, deleteFoodIntake } =
    useFoodIntakes(showMessage);

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
    fetchGoals();
    fetchBodyWeights();
    fetchFoodIntakes();
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
      showMessage({ type: 'success', text: `${payloads.length}セットを記録しました！` });
      // 保存した記録をすぐ確認できるよう、記録詳細へ移る
      setTab('records');
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

  const handleUpdateRecord = async (id: number, updated: TrainingRecord): Promise<boolean> => {
    try {
      const res = await fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      const data: TrainingRecord = await res.json();
      setRecords((prev) => prev.map((r) => (r.id === id ? data : r)));
      setEditingRecord(null);
      showMessage({ type: 'success', text: '記録を更新しました。' });
      return true;
    } catch (err: unknown) {
      console.error('Update failed:', err instanceof Error ? err.message : err);
      showMessage({ type: 'error', text: '記録の更新に失敗しました。' });
      return false;
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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.replace('/login');
  };

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          ログアウト
        </Button>
      </div>
      <Card>
        <CardContent>
          {message && <AlertMessage message={message} />}

          {tab === 'home' && (
            <HomeTab
              longTermGoals={longTermGoals}
              weeklyGoal={weeklyGoal}
              monthlyGoals={monthlyGoals}
              records={records}
              customExercisesWithCategory={customExercisesWithCategory}
              onNavigateToGoals={() => setTab('goals')}
              bodyWeights={bodyWeights}
              habitGoals={habitGoals}
              foodIntakes={foodIntakes}
            />
          )}

          {tab === 'write' && (
            <RecordTab
              customExercises={customExercises}
              customExercisesWithCategory={customExercisesWithCategory}
              allExercisesFlat={allExercisesFlat}
              loading={loading}
              onSave={handleSaveRecords}
              onSaveExercise={handleSaveExercise}
              showMessage={showMessage}
              records={records}
              foodIntakes={foodIntakes}
              foodLoading={foodLoading}
              onSaveFood={saveFoodIntake}
              onDeleteFood={deleteFoodIntake}
              bodyWeights={bodyWeights}
              bodyWeightLoading={bodyWeightLoading}
              onSaveBodyWeight={saveBodyWeight}
              onDeleteBodyWeight={deleteBodyWeight}
            />
          )}

          {tab === 'goals' && (
            <GoalsTab
              longTermGoals={longTermGoals}
              weeklyGoal={weeklyGoal}
              monthlyGoals={monthlyGoals}
              records={records}
              customExercisesWithCategory={customExercisesWithCategory}
              allExercisesFlat={allExercisesFlat}
              onAddLongTermGoal={addLongTermGoal}
              onDeleteLongTermGoal={deleteLongTermGoal}
              onSaveWeeklyGoal={saveWeeklyGoal}
              onSaveMonthlyGoals={saveMonthlyGoals}
              habitGoals={habitGoals}
              foodIntakes={foodIntakes}
              bodyWeights={bodyWeights}
              onSaveHabitGoals={saveHabitGoals}
            />
          )}

          {tab === 'calendar' && (
            <CalendarTab records={records} foodIntakes={foodIntakes} bodyWeights={bodyWeights} />
          )}

          {tab === 'stats' && (
            <StatsTab
              records={records}
              bodyWeights={bodyWeights}
              customExercisesWithCategory={customExercisesWithCategory}
            />
          )}

          {tab === 'records' && (
            <RecordsTab
              records={records}
              customExercisesWithCategory={customExercisesWithCategory}
              onEditRequest={setEditingRecord}
              onDeleteRequest={setDeleteConfirm}
            />
          )}
        </CardContent>
      </Card>

      <div className="bottom-nav-spacer" />
      <BottomNav tabs={MAIN_TABS} activeTab={tab} onTabChange={setTab} />

      {deleteConfirm !== null && (
        <DeleteConfirmModal
          loading={loading}
          onConfirm={() => handleDeleteRecord(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {editingRecord !== null && (
        <EditRecordModal
          record={editingRecord}
          customExercises={customExercises}
          customExercisesWithCategory={customExercisesWithCategory}
          loading={loading}
          onSave={handleUpdateRecord}
          onSaveExercise={handleSaveExercise}
          onCancel={() => setEditingRecord(null)}
          showMessage={showMessage}
        />
      )}
    </div>
  );
}
