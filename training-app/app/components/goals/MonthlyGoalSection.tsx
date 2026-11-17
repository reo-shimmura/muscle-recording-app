import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DEFAULT_EXERCISES } from '../../constants/exercises';
import { buildMonthlyItems } from '../../lib/goalItems';
import GoalProgressList from '../home/GoalProgressList';
import type { FrequencyGoal, TrainingRecord } from '../../types';
import Icon from '../Icon';

interface Props {
  monthlyGoals: FrequencyGoal[];
  records: TrainingRecord[];
  categoryMap: Record<string, string>;
  onSave: (items: { category: string; target_count: number }[]) => void;
}

const CATEGORIES = Object.keys(DEFAULT_EXERCISES);

/** ③月間目標：上に今月の達成状況（横棒）、下にカテゴリ（部位）ごとの回数の設定欄を置く */
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

  const items = buildMonthlyItems(monthlyGoals, records, categoryMap);

  return (
    <div>
      <h4><Icon name="calendar" />月間目標</h4>

      <GoalProgressList
        icon="chart-up"
        title="今月の達成状況"
        items={items}
        emptyMessage="まだ月間目標がありません。下の欄から設定してください。"
      />

      <h4 className="mt-6"><Icon name="target" />目標を設定</h4>
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
        <Button type="submit" className="mt-4"><Icon name="target" color="currentColor" />月間目標をまとめて設定する</Button>
      </form>
    </div>
  );
}
