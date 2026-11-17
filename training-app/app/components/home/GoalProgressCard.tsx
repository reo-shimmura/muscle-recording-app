import { Button } from '@/components/ui/button';
import GoalProgressList from './GoalProgressList';
import Icon from '../Icon';
import { hasAnyGoal, type GoalProgressItem } from '../../lib/goalItems';

interface Props {
  /** 習慣（今週）：筋トレ・プロテイン摂取・体重計の記録。目標の有無にかかわらず常に3件 */
  habitItems: GoalProgressItem[];
  longTermItems: GoalProgressItem[];
  monthlyItems: GoalProgressItem[];
  /** 週間目標を何週連続で達成しているか（0 なら表示しない） */
  weeklyGoalStreak: number;
  onNavigateToGoals: () => void;
}

/**
 * ホーム画面：習慣（今週）・長期・月間の目標の進捗を、1つのカードに横棒で並べる。
 * 習慣の3つは目標が未設定でも常に表示し、今週の回数が分かるようにする。
 */
export default function GoalProgressCard({ habitItems, longTermItems, monthlyItems, weeklyGoalStreak, onNavigateToGoals }: Props) {
  const anyGoal = hasAnyGoal([...habitItems, ...longTermItems, ...monthlyItems]);

  return (
    <div className="element-container">
      <h4><Icon name="target" />目標の進捗</h4>

      {weeklyGoalStreak > 0 && (
        <div className="alert alert-success" style={{ marginBottom: '0.25rem' }}>
          <Icon name="flame" color="var(--warning)" />週間目標 {weeklyGoalStreak}週連続達成中！
        </div>
      )}

      <GoalProgressList icon="calendar-training" title="習慣（今週）" items={habitItems} />
      <GoalProgressList icon="trophy" title="長期目標" items={longTermItems} />
      <GoalProgressList icon="calendar" title="月間目標（今月）" items={monthlyItems} />

      {anyGoal ? (
        <Button variant="outline" size="sm" className="mt-2" onClick={onNavigateToGoals}>
          すべての目標を見る
        </Button>
      ) : (
        <>
          <div className="small-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
            「目標管理」タブで目標を設定すると、達成率が表示されます。
          </div>
          <Button size="sm" className="mt-2" onClick={onNavigateToGoals}>
            <Icon name="target" color="currentColor" />目標を設定する
          </Button>
        </>
      )}
    </div>
  );
}
