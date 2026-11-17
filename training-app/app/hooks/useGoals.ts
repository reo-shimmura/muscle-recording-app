'use client'

import { useCallback, useState } from 'react';
import type { LongTermGoal, FrequencyGoal, GoalMetric, AlertMessage } from '../types';
import { HABIT_GOAL_KINDS, OVERALL_WEEKLY_CATEGORY, type HabitGoalKind } from '../constants/goals';

/** 習慣目標（プロテイン・体重計の週回数）。未設定なら null */
export type HabitGoals = Record<HabitGoalKind, FrequencyGoal | null>;

const EMPTY_HABIT_GOALS: HabitGoals = { protein: null, bodyWeight: null };

/** 週間の頻度目標から、筋トレ全体の目標を取り出す */
function pickOverallWeeklyGoal(goals: FrequencyGoal[]): FrequencyGoal | null {
  return goals.find((g) => g.category === OVERALL_WEEKLY_CATEGORY) ?? null;
}

/** 週間の頻度目標から、習慣目標（プロテイン・体重計）を取り出す */
function pickHabitGoals(goals: FrequencyGoal[]): HabitGoals {
  const find = (kind: HabitGoalKind) => goals.find((g) => g.category === HABIT_GOAL_KINDS[kind].category) ?? null;
  return { protein: find('protein'), bodyWeight: find('bodyWeight') };
}

interface UseGoalsReturn {
  longTermGoals: LongTermGoal[];
  weeklyGoal: FrequencyGoal | null;
  monthlyGoals: FrequencyGoal[];
  habitGoals: HabitGoals;
  loading: boolean;
  fetchGoals: () => Promise<void>;
  addLongTermGoal: (input: { exercise: string; metric: GoalMetric; target_value: number; unit: string }) => Promise<void>;
  deleteLongTermGoal: (id: number) => Promise<void>;
  saveWeeklyGoal: (targetCount: number) => Promise<void>;
  saveMonthlyGoals: (items: { category: string; target_count: number }[]) => Promise<void>;
  saveHabitGoals: (counts: Record<HabitGoalKind, number>) => Promise<void>;
}

export function useGoals(showMessage: (msg: AlertMessage) => void): UseGoalsReturn {
  const [longTermGoals, setLongTermGoals] = useState<LongTermGoal[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState<FrequencyGoal | null>(null);
  const [monthlyGoals, setMonthlyGoals] = useState<FrequencyGoal[]>([]);
  const [habitGoals, setHabitGoals] = useState<HabitGoals>(EMPTY_HABIT_GOALS);
  const [loading, setLoading] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const [longTermRes, weeklyRes, monthlyRes] = await Promise.all([
        fetch('/api/goals/long-term'),
        fetch('/api/goals/frequency?period=week'),
        fetch('/api/goals/frequency?period=month'),
      ]);
      if (!longTermRes.ok) throw new Error(`long-term: ${longTermRes.status}`);
      if (!weeklyRes.ok) throw new Error(`weekly: ${weeklyRes.status}`);
      if (!monthlyRes.ok) throw new Error(`monthly: ${monthlyRes.status}`);

      const longTerm: LongTermGoal[] = await longTermRes.json();
      const weekly: FrequencyGoal[] = await weeklyRes.json();
      const monthly: FrequencyGoal[] = await monthlyRes.json();

      setLongTermGoals(longTerm);
      // 週間の頻度目標には、筋トレ全体の目標と習慣目標（プロテイン・体重計）が含まれる
      setWeeklyGoal(pickOverallWeeklyGoal(weekly));
      setHabitGoals(pickHabitGoals(weekly));
      setMonthlyGoals(monthly);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '不明なエラーが発生しました。';
      console.error('目標データ読込エラー:', msg);
      showMessage({ type: 'error', text: '目標データの読込に失敗しました。' });
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  const addLongTermGoal = useCallback(
    async (input: { exercise: string; metric: GoalMetric; target_value: number; unit: string }) => {
      try {
        const res = await fetch('/api/goals/long-term', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(`Save failed: ${res.status}`);
        const goal: LongTermGoal = await res.json();
        setLongTermGoals((prev) => [goal, ...prev]);
        showMessage({ type: 'success', text: '長期目標を設定しました！' });
      } catch (err: unknown) {
        console.error('長期目標の保存に失敗:', err instanceof Error ? err.message : err);
        showMessage({ type: 'error', text: '長期目標の保存に失敗しました。' });
      }
    },
    [showMessage]
  );

  const deleteLongTermGoal = useCallback(
    async (id: number) => {
      try {
        const res = await fetch(`/api/goals/long-term/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
        setLongTermGoals((prev) => prev.filter((g) => g.id !== id));
      } catch (err: unknown) {
        console.error('長期目標の削除に失敗:', err instanceof Error ? err.message : err);
        showMessage({ type: 'error', text: '長期目標の削除に失敗しました。' });
      }
    },
    [showMessage]
  );

  const saveWeeklyGoal = useCallback(
    async (targetCount: number) => {
      try {
        const res = await fetch('/api/goals/frequency', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ periodType: 'week', items: [{ category: OVERALL_WEEKLY_CATEGORY, target_count: targetCount }] }),
        });
        if (!res.ok) throw new Error(`Save failed: ${res.status}`);
        const goals: FrequencyGoal[] = await res.json();
        setWeeklyGoal(pickOverallWeeklyGoal(goals));
        showMessage({ type: 'success', text: '週間目標を設定しました！' });
      } catch (err: unknown) {
        console.error('週間目標の保存に失敗:', err instanceof Error ? err.message : err);
        showMessage({ type: 'error', text: '週間目標の保存に失敗しました。' });
      }
    },
    [showMessage]
  );

  const saveMonthlyGoals = useCallback(
    async (items: { category: string; target_count: number }[]) => {
      try {
        const res = await fetch('/api/goals/frequency', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ periodType: 'month', items }),
        });
        if (!res.ok) throw new Error(`Save failed: ${res.status}`);
        const goals: FrequencyGoal[] = await res.json();
        setMonthlyGoals(goals);
        showMessage({ type: 'success', text: '月間目標を設定しました！' });
      } catch (err: unknown) {
        console.error('月間目標の保存に失敗:', err instanceof Error ? err.message : err);
        showMessage({ type: 'error', text: '月間目標の保存に失敗しました。' });
      }
    },
    [showMessage]
  );

  const saveHabitGoals = useCallback(
    async (counts: Record<HabitGoalKind, number>) => {
      try {
        const items = (Object.keys(counts) as HabitGoalKind[]).map((kind) => ({
          category: HABIT_GOAL_KINDS[kind].category,
          target_count: counts[kind],
        }));
        const res = await fetch('/api/goals/frequency', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ periodType: 'week', items }),
        });
        if (!res.ok) throw new Error(`Save failed: ${res.status}`);
        const goals: FrequencyGoal[] = await res.json();
        setHabitGoals(pickHabitGoals(goals));
        showMessage({ type: 'success', text: '習慣目標を設定しました！' });
      } catch (err: unknown) {
        console.error('習慣目標の保存に失敗:', err instanceof Error ? err.message : err);
        showMessage({ type: 'error', text: '習慣目標の保存に失敗しました。' });
      }
    },
    [showMessage]
  );

  return {
    longTermGoals,
    weeklyGoal,
    monthlyGoals,
    habitGoals,
    loading,
    fetchGoals,
    addLongTermGoal,
    deleteLongTermGoal,
    saveWeeklyGoal,
    saveMonthlyGoals,
    saveHabitGoals,
  };
}
