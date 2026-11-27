import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/ui/number-input';
import type { FrequencyGoal } from '../../types';
import Icon from '../Icon';

interface Props {
  weeklyGoal: FrequencyGoal | null;
  onSave: (targetCount: number) => void;
}

/** ②週間目標（筋トレ）：1週間に何回筋トレに行くかを設定する（達成状況は目標管理画面の上部に表示） */
export default function WeeklyGoalSection({ weeklyGoal, onSave }: Props) {
  const [targetCount, setTargetCount] = useState(weeklyGoal?.target_count ?? 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(targetCount);
  };

  return (
    <div>
      <h5 style={{ fontWeight: 700, margin: '0.5rem 0 0' }}><Icon name="lifter" />筋トレ</h5>
      <p className="small-muted">1週間（月〜日）のうち何回筋トレに行くかを設定します。</p>

      <form onSubmit={handleSubmit} className="element-container">
        <div className="grid-cols-2">
          <div>
            <label>週に何回行くか</label>
            <NumberInput min="1" max="7" value={targetCount} onChange={setTargetCount} required />
          </div>
        </div>
        <Button type="submit" className="mt-4"><Icon name="target" color="currentColor" />週間目標を設定する</Button>
      </form>
    </div>
  );
}
