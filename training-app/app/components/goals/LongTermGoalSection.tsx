import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import GoalForm from './GoalForm';
import { calcLongTermGoalProgress } from '../../lib/goalsProgress';
import type { LongTermGoal, GoalMetric, TrainingRecord } from '../../types';

interface Props {
  goals: LongTermGoal[];
  records: TrainingRecord[];
  allExercisesFlat: string[];
  onAdd: (goal: { exercise: string; metric: GoalMetric; target_value: number; unit: string }) => void;
  onDelete: (id: number) => void;
}

const METRIC_LABELS: Record<GoalMetric, string> = {
  max_weight: '最大重量',
  total_sets: '累計セット数',
  total_reps: '累計回数',
};

/** ①長期目標セクション：種目ごとの数値目標（例: ベンチプレス 最大重量60kg）を設定・表示する */
export default function LongTermGoalSection({ goals, records, allExercisesFlat, onAdd, onDelete }: Props) {
  return (
    <div>
      <h4>🏆 長期目標</h4>
      <p className="small-muted">最終的に達成したい目標を種目ごとに設定します。</p>
      <GoalForm onAdd={onAdd} exercises={allExercisesFlat} />

      {goals.length > 0 ? (
        <div>
          {goals.map((g) => {
            const progress = calcLongTermGoalProgress(g, records);
            return (
              <Card key={g.id} className="mb-3 border-l-4 border-l-primary">
                <CardContent>
                  <div className="record-item-title">{g.exercise}（{METRIC_LABELS[g.metric]}）</div>
                  <div className="record-item-meta">
                    目標: {g.target_value} {g.unit}　実績: {progress.current} {g.unit}（{progress.percent}%）
                  </div>
                  <Progress value={progress.percent} className="mt-2" />
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => onDelete(g.id)}>
                    削除
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="alert alert-info">まだ長期目標がありません。上記で目標を追加してください。</div>
      )}
    </div>
  );
}
