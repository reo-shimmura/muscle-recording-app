import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import GoalRing from './GoalRing';
import BodyWeightCard from './BodyWeightCard';
import MotivationCard from './MotivationCard';
import LastTrainedCard from './LastTrainedCard';
import CalendarGrid from '../calendar/CalendarGrid';
import { buildExerciseCategoryMap } from '../../constants/exercises';
import { groupRecordsByExercise } from '../../lib/groupRecords';
import {
  calcLongTermGoalProgress,
  calcWeeklyGoalProgress,
  calcWeeklyDaysProgress,
  type GoalProgress,
  calcMonthlyGoalProgress,
} from '../../lib/goalsProgress';
import { calcWeeklyGoalStreak } from '../../lib/streak';
import type { LongTermGoal, FrequencyGoal, TrainingRecord, CustomExercise, BodyWeight, ProteinIntake } from '../../types';
import { HABIT_GOAL_KINDS, type HabitGoalKind } from '../../constants/goals';
import type { HabitGoals } from '../../hooks/useGoals';
import Icon from '../Icon';
import { formatRecordDetail } from '../../lib/recordFormat';

interface Props {
  longTermGoals: LongTermGoal[];
  weeklyGoal: FrequencyGoal | null;
  monthlyGoals: FrequencyGoal[];
  records: TrainingRecord[];
  customExercisesWithCategory: CustomExercise[];
  onNavigateToGoals: () => void;
  bodyWeights: BodyWeight[];
  habitGoals: HabitGoals;
  proteinIntakes: ProteinIntake[];
}

// ホームでは主要な目標のみ抜粋し、残りは目標管理タブに誘導する
const MAX_ITEMS = 3;

/** ホーム画面：長期・週間・月間の目標達成度をリング型グラフで一覧表示する */
export default function HomeTab({
  longTermGoals,
  weeklyGoal,
  monthlyGoals,
  records,
  customExercisesWithCategory,
  onNavigateToGoals,
  bodyWeights,
  habitGoals,
  proteinIntakes,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedDateRecords = selectedDate ? records.filter((r) => r.date === selectedDate) : [];
  const groupedDateRecords = groupRecordsByExercise(selectedDateRecords);

  const categoryMap = useMemo(
    () => buildExerciseCategoryMap(customExercisesWithCategory),
    [customExercisesWithCategory]
  );

  const weeklyProgress = useMemo(
    () => (weeklyGoal ? calcWeeklyGoalProgress(weeklyGoal, records) : null),
    [weeklyGoal, records]
  );

  // 習慣目標（今週）：筋トレの回数に加え、プロテイン摂取・体重計の記録の日数。目標を設定しているものだけ並べる
  const habitRings = useMemo(() => {
    const rings: { key: string; label: string; unit: string; progress: GoalProgress }[] = [];
    if (weeklyProgress) rings.push({ key: 'training', label: '筋トレ', unit: '回', progress: weeklyProgress });
    const habitDates: Record<HabitGoalKind, string[]> = {
      protein: proteinIntakes.map((p) => p.date),
      bodyWeight: bodyWeights.map((b) => b.date),
    };
    for (const kind of Object.keys(HABIT_GOAL_KINDS) as HabitGoalKind[]) {
      const goal = habitGoals[kind];
      if (!goal || goal.target_count <= 0) continue;
      rings.push({
        key: kind,
        label: HABIT_GOAL_KINDS[kind].label,
        unit: '日',
        progress: calcWeeklyDaysProgress(goal.target_count, habitDates[kind]),
      });
    }
    return rings;
  }, [weeklyProgress, habitGoals, proteinIntakes, bodyWeights]);
  const weeklyGoalStreak = useMemo(() => calcWeeklyGoalStreak(weeklyGoal, records), [weeklyGoal, records]);

  // 達成率が低い（伸びしろが大きい）順に主要な目標だけを抜粋する
  const longTermHighlights = useMemo(() => {
    return longTermGoals
      .map((goal) => ({ goal, progress: calcLongTermGoalProgress(goal, records) }))
      .sort((a, b) => a.progress.percent - b.progress.percent)
      .slice(0, MAX_ITEMS);
  }, [longTermGoals, records]);

  // 月間目標は全カテゴリ分を一覧できるようにする（長期目標のみ主要件数に絞る）
  const monthlyProgressList = useMemo(() => {
    return monthlyGoals
      .filter((goal) => goal.target_count > 0)
      .map((goal) => ({ goal, progress: calcMonthlyGoalProgress(goal, records, categoryMap) }))
      .sort((a, b) => a.progress.percent - b.progress.percent);
  }, [monthlyGoals, records, categoryMap]);

  const hasAnyGoal =
    longTermGoals.length > 0 || habitRings.length > 0 || monthlyProgressList.length > 0;

  return (
    <div>
      <h3><Icon name="home" />ホーム</h3>

      <MotivationCard records={records} />

      <LastTrainedCard records={records} categoryMap={categoryMap} />

      <BodyWeightCard bodyWeights={bodyWeights} />

      <div className="element-container">
        <h4><Icon name="calendar" />カレンダー</h4>
        <CalendarGrid
          records={records}
          currentMonth={currentMonth}
          currentYear={currentYear}
          selectedDate={selectedDate}
          onMonthChange={(month, year) => {
            setCurrentMonth(month);
            setCurrentYear(year);
          }}
          onDateSelect={setSelectedDate}
        />

        <Dialog open={!!selectedDate} onOpenChange={(open) => { if (!open) setSelectedDate(null); }}>
          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle><Icon name="training-log" />{selectedDate} のトレーニング内容</DialogTitle>
            </DialogHeader>
            {selectedDateRecords.length === 0 ? (
              <div className="small-muted">この日のトレーニング記録はありません。</div>
            ) : (
              <div>
                {groupedDateRecords.map((group) => (
                  <Card key={group.exercise} className="mb-3 border-l-4 border-l-primary">
                    <CardContent>
                      <div className="record-item-title">{group.exercise}</div>
                      {group.records.map((r) => (
                        <div key={r.id} className="record-item-meta">
                          {formatRecordDetail(r)}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {weeklyGoalStreak > 0 && (
        <div className="element-container">
          <div className="alert alert-success"><Icon name="flame" color="var(--warning)" />週間目標 {weeklyGoalStreak}週連続達成中！</div>
        </div>
      )}

      {!hasAnyGoal && (
        <div className="element-container">
          <div className="alert alert-info">
            まだ目標が設定されていません。「目標管理」タブから長期・週間・月間の目標を設定しましょう。
          </div>
          <Button onClick={onNavigateToGoals}><Icon name="target" color="currentColor" />目標を設定する</Button>
        </div>
      )}

      {habitRings.length > 0 && (
        <div className="element-container">
          <h4><Icon name="calendar-training" />習慣目標（今週）</h4>
          <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            {habitRings.map(({ key, label, unit, progress }) => (
              <GoalRing
                key={key}
                label={label}
                sublabel={`${progress.current} / ${progress.target} ${unit}`}
                percent={progress.percent}
              />
            ))}
          </div>
        </div>
      )}

      {longTermHighlights.length > 0 && (
        <div className="element-container">
          <h4><Icon name="trophy" />長期目標</h4>
          <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            {longTermHighlights.map(({ goal, progress }) => (
              <GoalRing
                key={goal.id}
                label={goal.exercise}
                sublabel={`${progress.current} / ${progress.target} ${goal.unit}`}
                percent={progress.percent}
              />
            ))}
          </div>
        </div>
      )}

      {monthlyProgressList.length > 0 && (
        <div className="element-container">
          <h4><Icon name="calendar" />月間目標</h4>
          <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            {monthlyProgressList.map(({ goal, progress }) => (
              <GoalRing
                key={goal.id}
                label={goal.category}
                sublabel={`${progress.current} / ${progress.target} 回`}
                percent={progress.percent}
              />
            ))}
          </div>
        </div>
      )}

      {hasAnyGoal && <Button onClick={onNavigateToGoals}>すべての目標を見る</Button>}
    </div>
  );
}
