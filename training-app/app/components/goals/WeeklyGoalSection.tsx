import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { calcWeeklyGoalProgress } from '../../lib/goalsProgress';
import type { FrequencyGoal, TrainingRecord } from '../../types';

interface Props {
  weeklyGoal: FrequencyGoal | null;
  records: TrainingRecord[];
  onSave: (targetCount: number) => void;
}

/** ②週間目標セクション：1週間に何回筋トレに行くかを設定・表示する */
export default function WeeklyGoalSection({ weeklyGoal, records, onSave }: Props) {
  const [targetCount, setTargetCount] = useState(weeklyGoal?.target_count ?? 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(targetCount);
  };

  const progress = weeklyGoal ? calcWeeklyGoalProgress(weeklyGoal, records) : null;

  return (
    <div>
      <h4>📆 週間目標</h4>
      <p className="small-muted">1週間（月〜日）のうち何回筋トレに行くかを設定します。</p>

      <form onSubmit={handleSubmit} className="element-container">
        <div className="grid-cols-2">
          <div>
            <label>週に何回行くか</label>
            <input
              type="number"
              min="1"
              max="7"
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
              required
            />
          </div>
        </div>
        <Button type="submit" className="mt-4">🎯 週間目標を設定する</Button>
      </form>

      {progress && (
        <Card className="mt-3 border-l-4 border-l-primary">
          <CardContent>
            <div className="record-item-title">今週の実績</div>
            <div className="record-item-meta">
              {progress.current} / {progress.target} 回（{progress.percent}%）
            </div>
            <Progress value={progress.percent} className="mt-2" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
