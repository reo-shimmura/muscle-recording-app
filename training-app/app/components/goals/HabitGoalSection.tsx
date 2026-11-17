'use client'

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import Icon, { type IconName } from '../Icon';
import { HABIT_GOAL_KINDS, type HabitGoalKind } from '../../constants/goals';
import type { HabitGoals } from '../../hooks/useGoals';

interface Props {
  habitGoals: HabitGoals;
  onSave: (counts: Record<HabitGoalKind, number>) => void;
}

const HABIT_ICONS: Record<HabitGoalKind, IconName> = {
  protein: 'shaker',
  bodyWeight: 'scale',
};

// 未設定のときに入力欄へ出す初期値
const DEFAULT_COUNTS: Record<HabitGoalKind, number> = { protein: 5, bodyWeight: 7 };

const KINDS = Object.keys(HABIT_GOAL_KINDS) as HabitGoalKind[];

/** 週間目標「習慣」：プロテイン摂取・体重計の記録を、週に何日行うかを設定する（達成状況は目標管理画面の上部に表示） */
export default function HabitGoalSection({ habitGoals, onSave }: Props) {
  const [counts, setCounts] = useState<Record<HabitGoalKind, number>>(() => ({
    protein: habitGoals.protein?.target_count ?? DEFAULT_COUNTS.protein,
    bodyWeight: habitGoals.bodyWeight?.target_count ?? DEFAULT_COUNTS.bodyWeight,
  }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(counts);
  };

  return (
    <div className="mt-4">
      <h5 style={{ fontWeight: 700, margin: '0.5rem 0 0' }}><Icon name="shaker" />プロテイン・体重計</h5>
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
    </div>
  );
}
