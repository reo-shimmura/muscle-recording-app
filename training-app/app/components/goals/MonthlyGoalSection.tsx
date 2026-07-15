import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DEFAULT_EXERCISES } from '../../constants/exercises';
import { calcMonthlyGoalProgress } from '../../lib/goalsProgress';
import type { FrequencyGoal, TrainingRecord } from '../../types';

interface Props {
  monthlyGoals: FrequencyGoal[];
  records: TrainingRecord[];
  categoryMap: Record<string, string>;
  onSave: (items: { category: string; target_count: number }[]) => void;
}

const CATEGORIES = Object.keys(DEFAULT_EXERCISES);

/** ③月間目標セクション：カテゴリ（部位）ごとに1か月何回筋トレに行くかを一括設定・表示する */
export default function MonthlyGoalSection({ monthlyGoals, records, categoryMap, onSave }: Props) {
  const [targetCounts, setTargetCounts] = useState<Record<string, number>>(
    Object.fromEntries(CATEGORIES.map((c) => [c, 0]))
  );

  useEffect(() => {
    if (monthlyGoals.length === 0) return;
    setTargetCounts((prev) => {
      const next = { ...prev };
      for (const g of monthlyGoals) {
        if (g.category in next) next[g.category] = g.target_count;
      }
      return next;
    });
  }, [monthlyGoals]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(CATEGORIES.map((category) => ({ category, target_count: targetCounts[category] })));
  };

  const goalByCategory = new Map(monthlyGoals.map((g) => [g.category, g]));

  return (
    <div>
      <h4>🗓️ 月間目標</h4>
      <p className="small-muted">1か月のうち、カテゴリ（部位）ごとに何回筋トレに行くかを設定します。</p>

      <form onSubmit={handleSubmit} className="element-container">
        <div className="grid-cols-2">
          {CATEGORIES.map((category) => (
            <div key={category}>
              <label>{category}（回/月）</label>
              <input
                type="number"
                min="0"
                value={targetCounts[category]}
                onChange={(e) =>
                  setTargetCounts((prev) => ({ ...prev, [category]: Number(e.target.value) }))
                }
              />
            </div>
          ))}
        </div>
        <Button type="submit" className="mt-4">🎯 月間目標をまとめて設定する</Button>
      </form>

      {monthlyGoals.length > 0 && (
        <div className="mt-3">
          {CATEGORIES.map((category) => {
            const goal = goalByCategory.get(category);
            if (!goal || goal.target_count <= 0) return null;
            const progress = calcMonthlyGoalProgress(goal, records, categoryMap);
            return (
              <Card key={category} className="mb-3 border-l-4 border-l-primary">
                <CardContent>
                  <div className="record-item-title">{category}</div>
                  <div className="record-item-meta">
                    今月の実績: {progress.current} / {progress.target} 回（{progress.percent}%）
                  </div>
                  <Progress value={progress.percent} className="mt-2" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
