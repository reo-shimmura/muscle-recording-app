'use client'

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import LongTermGoalSection from './LongTermGoalSection';
import WeeklyGoalSection from './WeeklyGoalSection';
import HabitGoalSection from './HabitGoalSection';
import MonthlyGoalSection from './MonthlyGoalSection';
import GoalProgressList from '../home/GoalProgressList';
import { buildHabitItems } from '../../lib/goalItems';
import { buildExerciseCategoryMap } from '../../constants/exercises';
import type { HabitGoalKind } from '../../constants/goals';
import type { HabitGoals } from '../../hooks/useGoals';
import type {
  BodyWeight,
  CustomExercise,
  FrequencyGoal,
  GoalMetric,
  LongTermGoal,
  ProteinIntake,
  TrainingRecord,
} from '../../types';
import Icon, { type IconName } from '../Icon';

interface Props {
  longTermGoals: LongTermGoal[];
  weeklyGoal: FrequencyGoal | null;
  monthlyGoals: FrequencyGoal[];
  habitGoals: HabitGoals;
  records: TrainingRecord[];
  proteinIntakes: ProteinIntake[];
  bodyWeights: BodyWeight[];
  customExercisesWithCategory: CustomExercise[];
  allExercisesFlat: string[];
  onAddLongTermGoal: (goal: { exercise: string; metric: GoalMetric; target_value: number; unit: string }) => void;
  onDeleteLongTermGoal: (id: number) => void;
  onSaveWeeklyGoal: (targetCount: number) => void;
  onSaveMonthlyGoals: (items: { category: string; target_count: number }[]) => void;
  onSaveHabitGoals: (counts: Record<HabitGoalKind, number>) => void;
}

type GoalSection = 'longTerm' | 'weekly' | 'monthly';

// 画面上部の切り替えボタン（3種類の目標の境界を分かりやすくするため、1つずつ表示する）
const SECTION_TABS: { id: GoalSection; label: string; icon: IconName }[] = [
  { id: 'longTerm', label: '長期目標', icon: 'trophy' },
  { id: 'weekly', label: '週間目標', icon: 'calendar-training' },
  { id: 'monthly', label: '月間目標', icon: 'calendar' },
];

/** 目標管理タブ：長期・週間・月間を上部のボタンで切り替え、各タブの上に達成状況、下に設定欄を置く */
export default function GoalsTab({
  longTermGoals,
  weeklyGoal,
  monthlyGoals,
  habitGoals,
  records,
  proteinIntakes,
  bodyWeights,
  customExercisesWithCategory,
  allExercisesFlat,
  onAddLongTermGoal,
  onDeleteLongTermGoal,
  onSaveWeeklyGoal,
  onSaveMonthlyGoals,
  onSaveHabitGoals,
}: Props) {
  const [section, setSection] = useState<GoalSection>('longTerm');

  const categoryMap = useMemo(
    () => buildExerciseCategoryMap(customExercisesWithCategory),
    [customExercisesWithCategory]
  );
  // 週間目標タブの上部に出す、今週の習慣（筋トレ・プロテイン・体重計）の達成状況
  const habitItems = useMemo(
    () => buildHabitItems({ weeklyGoal, habitGoals, records, proteinIntakes, bodyWeights }),
    [weeklyGoal, habitGoals, records, proteinIntakes, bodyWeights]
  );

  return (
    <div>
      <h3><Icon name="target" />目標管理</h3>

      <div className="row element-container" style={{ flexWrap: 'wrap' }}>
        {SECTION_TABS.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            variant={section === tab.id ? 'default' : 'outline'}
            onClick={() => setSection(tab.id)}
          >
            <Icon name={tab.icon} color="currentColor" />
            {tab.label}
          </Button>
        ))}
      </div>

      {section === 'longTerm' && (
        <LongTermGoalSection
          goals={longTermGoals}
          records={records}
          allExercisesFlat={allExercisesFlat}
          categoryMap={categoryMap}
          onAdd={onAddLongTermGoal}
          onDelete={onDeleteLongTermGoal}
        />
      )}

      {section === 'weekly' && (
        <div>
          <h4><Icon name="calendar-training" />週間目標</h4>
          <GoalProgressList icon="chart-up" title="今週の達成状況" items={habitItems} />

          <h4 className="mt-6"><Icon name="target" />目標を設定</h4>
          <WeeklyGoalSection weeklyGoal={weeklyGoal} onSave={onSaveWeeklyGoal} />
          <HabitGoalSection habitGoals={habitGoals} onSave={onSaveHabitGoals} />
        </div>
      )}

      {section === 'monthly' && (
        <MonthlyGoalSection
          monthlyGoals={monthlyGoals}
          records={records}
          categoryMap={categoryMap}
          onSave={onSaveMonthlyGoals}
        />
      )}
    </div>
  );
}
