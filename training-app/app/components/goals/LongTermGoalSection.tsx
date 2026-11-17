import { Button } from '@/components/ui/button';
import GoalForm from './GoalForm';
import GoalProgressList from '../home/GoalProgressList';
import { buildLongTermItems } from '../../lib/goalItems';
import type { LongTermGoal, GoalMetric, TrainingRecord } from '../../types';
import Icon from '../Icon';

interface Props {
  goals: LongTermGoal[];
  records: TrainingRecord[];
  allExercisesFlat: string[];
  categoryMap: Record<string, string>;
  onAdd: (goal: { exercise: string; metric: GoalMetric; target_value: number; unit: string }) => void;
  onDelete: (id: number) => void;
}

/**
 * ①長期目標：上に全目標の達成状況（横棒・削除ボタン付き）、下に目標の設定欄を置く。
 * 例: ベンチプレス 最大重量60kg、ランニング 累計距離100km
 */
export default function LongTermGoalSection({ goals, records, allExercisesFlat, categoryMap, onAdd, onDelete }: Props) {
  const items = buildLongTermItems(goals, records);

  const handleDelete = (id: number, label: string) => {
    if (window.confirm(`長期目標「${label}」を削除しますか？`)) onDelete(id);
  };

  return (
    <div>
      <h4><Icon name="trophy" />長期目標</h4>

      <GoalProgressList
        icon="chart-up"
        title="達成状況"
        items={items}
        emptyMessage="まだ長期目標がありません。下の欄から追加してください。"
        renderAction={(item) =>
          item.goalId !== null && (
            <Button variant="ghost" size="xs" onClick={() => handleDelete(item.goalId!, item.label)}>
              削除
            </Button>
          )
        }
      />

      <h4 className="mt-6"><Icon name="target" />目標を設定</h4>
      <p className="small-muted">
        最終的に達成したい目標を種目ごとに設定します。ランニングなど有酸素の種目は、累計距離・累計時間を目標にできます。
      </p>
      <GoalForm onAdd={onAdd} exercises={allExercisesFlat} categoryMap={categoryMap} />
    </div>
  );
}
