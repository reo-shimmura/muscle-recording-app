'use client'

import { useState, type FormEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Icon, { type IconName } from '../Icon';
import { calcWeeklyDaysProgress } from '../../lib/goalsProgress';
import { HABIT_GOAL_KINDS, type HabitGoalKind } from '../../constants/goals';
import type { HabitGoals } from '../../hooks/useGoals';

interface Props {
  habitGoals: HabitGoals;
  /** 習慣ごとの記録日（プロテインを飲んだ日・体重を測った日） */
  habitDates: Record<HabitGoalKind, string[]>;
  onSave: (counts: Record<HabitGoalKind, number>) => void;
}

const HABIT_ICONS: Record<HabitGoalKind, IconName> = {
  protein: 'shaker',
  bodyWeight: 'scale',
};

// 未設定のときに入力欄へ出す初期値
const DEFAULT_COUNTS: Record<HabitGoalKind, number> = { protein: 5, bodyWeight: 7 };

const KINDS = Object.keys(HABIT_GOAL_KINDS) as HabitGoalKind[];

/** 週間目標「習慣」：プロテイン摂取・体重計の記録を、週に何日行うかを設定・表示する */
export default function HabitGoalSection({ habitGoals, habitDates, onSave }: Props) {
  const [counts, setCounts] = useState<Record<HabitGoalKind, number>>(() => ({
    protein: habitGoals.protein?.target_count ?? DEFAULT_COUNTS.protein,
    bodyWeight: habitGoals.bodyWeight?.target_count ?? DEFAULT_COUNTS.bodyWeight,
  }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(counts);
  };

  return (
    <div className="mt-6">
      <h4><Icon name="calendar-training" />習慣の週間目標</h4>
      <p className="small-muted">1週間（月〜日）のうち、何日記録するかを設定します。0 にすると目標なしになります。</p>

      <form onSubmit={handleSubmit} className="element-container">
        <div className="grid-cols-2">
          {KINDS.map((kind) => (
            <div key={kind}>
              <label htmlFor={`habit-${kind}`}>
                <Icon name={HABIT_ICONS[kind]} />{HABIT_GOAL_KINDS[kind].label}（週に何日）
              </label>
              <input
                id={`habit-${kind}`}
                type="number"
                min="0"
                max="7"
                value={counts[kind]}
                onChange={(e) => setCounts((prev) => ({ ...prev, [kind]: Number(e.target.value) }))}
                required
              />
            </div>
          ))}
        </div>
        <Button type="submit" className="mt-4"><Icon name="target" color="currentColor" />習慣目標を設定する</Button>
      </form>

      {KINDS.map((kind) => {
        const goal = habitGoals[kind];
        if (!goal || goal.target_count <= 0) return null;
        const progress = calcWeeklyDaysProgress(goal.target_count, habitDates[kind]);
        return (
          <Card key={kind} className="mt-3 border-l-4 border-l-primary">
            <CardContent>
              <div className="record-item-title">
                <Icon name={HABIT_ICONS[kind]} />{HABIT_GOAL_KINDS[kind].label}（今週）
              </div>
              <div className="record-item-meta">
                {progress.current} / {progress.target} 日（{progress.percent}%）
              </div>
              <Progress value={progress.percent} className="mt-2" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
