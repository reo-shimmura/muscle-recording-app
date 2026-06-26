import GoalForm from './GoalForm';
import type { Goal } from '../../types';

interface Props {
  goals: Goal[];
  allExercisesFlat: string[];
  onAddGoal: (goal: Goal) => void;
}

/** 目標管理タブ：目標入力フォームと設定済み目標の一覧を表示 */
export default function GoalsTab({ goals, allExercisesFlat, onAddGoal }: Props) {
  return (
    <div>
      <h3>🎯 目標を追加</h3>
      <GoalForm onAdd={onAddGoal} exercises={allExercisesFlat} />
      {goals.length > 0 ? (
        <>
          <h4>設定済みの目標</h4>
          <div>
            {goals.map((g) => (
              <div key={g.id} className="record-item">
                <div className="record-item-title">{g.exercise}</div>
                <div className="record-item-meta">目標: {g.value} {g.unit}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="alert alert-info">
          まだ目標がありません。上記で目標を追加してください。
        </div>
      )}
    </div>
  );
}
