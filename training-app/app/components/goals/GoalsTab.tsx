import { useMemo } from 'react';
import LongTermGoalSection from './LongTermGoalSection';
import WeeklyGoalSection from './WeeklyGoalSection';
import MonthlyGoalSection from './MonthlyGoalSection';
import { buildExerciseCategoryMap } from '../../constants/exercises';
import type { LongTermGoal, FrequencyGoal, GoalMetric, TrainingRecord, CustomExercise } from '../../types';

interface Props {
  longTermGoals: LongTermGoal[];
  weeklyGoal: FrequencyGoal | null;
  monthlyGoals: FrequencyGoal[];
  records: TrainingRecord[];
  customExercisesWithCategory: CustomExercise[];
  allExercisesFlat: string[];
  onAddLongTermGoal: (goal: { exercise: string; metric: GoalMetric; target_value: number; unit: string }) => void;
  onDeleteLongTermGoal: (id: number) => void;
  onSaveWeeklyGoal: (targetCount: number) => void;
  onSaveMonthlyGoals: (items: { category: string; target_count: number }[]) => void;
}

/** 目標管理タブ：①長期目標 ②週間目標 ③月間目標 の3種類の目標を設定・表示する */
export default function GoalsTab({
  longTermGoals,
  weeklyGoal,
  monthlyGoals,
  records,
  customExercisesWithCategory,
  allExercisesFlat,
  onAddLongTermGoal,
  onDeleteLongTermGoal,
  onSaveWeeklyGoal,
  onSaveMonthlyGoals,
}: Props) {
  const categoryMap = useMemo(
    () => buildExerciseCategoryMap(customExercisesWithCategory),
    [customExercisesWithCategory]
  );

  return (
    <div>
      <h3>🎯 目標管理</h3>

      <LongTermGoalSection
        goals={longTermGoals}
        records={records}
        allExercisesFlat={allExercisesFlat}
        onAdd={onAddLongTermGoal}
        onDelete={onDeleteLongTermGoal}
      />

      <WeeklyGoalSection weeklyGoal={weeklyGoal} records={records} onSave={onSaveWeeklyGoal} />

      <MonthlyGoalSection
        monthlyGoals={monthlyGoals}
        records={records}
        categoryMap={categoryMap}
        onSave={onSaveMonthlyGoals}
      />
    </div>
  );
}
