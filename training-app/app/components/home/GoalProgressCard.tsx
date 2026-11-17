import { Button } from '@/components/ui/button';
import GoalProgressBar, { type GoalProgressItem } from './GoalProgressBar';
import Icon, { type IconName } from '../Icon';

interface Props {
  habitItems: GoalProgressItem[];
  longTermItems: GoalProgressItem[];
  monthlyItems: GoalProgressItem[];
  /** 週間目標を何週連続で達成しているか（0 なら表示しない） */
  weeklyGoalStreak: number;
  onNavigateToGoals: () => void;
}

function Group({ icon, title, items }: { icon: IconName; title: string; items: GoalProgressItem[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
        <Icon name={icon} />{title}
      </div>
      {items.map((item) => (
        <GoalProgressBar key={item.key} item={item} />
      ))}
    </div>
  );
}

/**
 * ホーム画面：習慣（今週）・長期・月間の目標の進捗を、1つのカードに横棒で並べる。
 * リング表示より縦に詰まり、ホームを開いてすぐに全体を見渡せるようにする。
 */
export default function GoalProgressCard({ habitItems, longTermItems, monthlyItems, weeklyGoalStreak, onNavigateToGoals }: Props) {
  const hasAnyGoal = habitItems.length > 0 || longTermItems.length > 0 || monthlyItems.length > 0;

  return (
    <div className="element-container">
      <h4><Icon name="target" />目標の進捗</h4>

      {!hasAnyGoal ? (
        <>
          <div className="alert alert-info">
            まだ目標が設定されていません。「目標管理」タブから長期・週間・月間の目標を設定しましょう。
          </div>
          <Button onClick={onNavigateToGoals}><Icon name="target" color="currentColor" />目標を設定する</Button>
        </>
      ) : (
        <>
          {weeklyGoalStreak > 0 && (
            <div className="alert alert-success" style={{ marginBottom: '0.25rem' }}>
              <Icon name="flame" color="var(--warning)" />週間目標 {weeklyGoalStreak}週連続達成中！
            </div>
          )}
          <Group icon="calendar-training" title="習慣（今週）" items={habitItems} />
          <Group icon="trophy" title="長期目標" items={longTermItems} />
          <Group icon="calendar" title="月間目標（今月）" items={monthlyItems} />
          <Button variant="outline" size="sm" className="mt-2" onClick={onNavigateToGoals}>
            すべての目標を見る
          </Button>
        </>
      )}
    </div>
  );
}
