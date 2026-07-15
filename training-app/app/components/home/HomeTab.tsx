import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import GoalRing from './GoalRing';
import CalendarGrid from '../calendar/CalendarGrid';
import { buildExerciseCategoryMap } from '../../constants/exercises';
import {
  calcLongTermGoalProgress,
  calcWeeklyGoalProgress,
  calcMonthlyGoalProgress,
} from '../../lib/goalsProgress';
import type { LongTermGoal, FrequencyGoal, TrainingRecord, CustomExercise } from '../../types';

interface Props {
  longTermGoals: LongTermGoal[];
  weeklyGoal: FrequencyGoal | null;
  monthlyGoals: FrequencyGoal[];
  records: TrainingRecord[];
  customExercisesWithCategory: CustomExercise[];
  onNavigateToGoals: () => void;
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
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedDateRecords = selectedDate ? records.filter((r) => r.date === selectedDate) : [];

  const categoryMap = useMemo(
    () => buildExerciseCategoryMap(customExercisesWithCategory),
    [customExercisesWithCategory]
  );

  const weeklyProgress = weeklyGoal ? calcWeeklyGoalProgress(weeklyGoal, records) : null;

  // 達成率が低い（伸びしろが大きい）順に主要な目標だけを抜粋する
  const longTermHighlights = useMemo(() => {
    return longTermGoals
      .map((goal) => ({ goal, progress: calcLongTermGoalProgress(goal, records) }))
      .sort((a, b) => a.progress.percent - b.progress.percent)
      .slice(0, MAX_ITEMS);
  }, [longTermGoals, records]);

  const monthlyHighlights = useMemo(() => {
    return monthlyGoals
      .filter((goal) => goal.target_count > 0)
      .map((goal) => ({ goal, progress: calcMonthlyGoalProgress(goal, records, categoryMap) }))
      .sort((a, b) => a.progress.percent - b.progress.percent)
      .slice(0, MAX_ITEMS);
  }, [monthlyGoals, records, categoryMap]);

  const hasAnyGoal =
    longTermGoals.length > 0 || weeklyProgress !== null || monthlyHighlights.length > 0;

  return (
    <div>
      <h3>🏠 ホーム</h3>

      <div className="element-container">
        <h4>📅 カレンダー</h4>
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

        {selectedDate && (
          <div>
            <h4>📋 {selectedDate} のトレーニング内容</h4>
            {selectedDateRecords.length === 0 ? (
              <div className="small-muted">この日のトレーニング記録はありません。</div>
            ) : (
              <div>
                {selectedDateRecords.map((r) => (
                  <Card key={r.id} className="mb-3 border-l-4 border-l-primary">
                    <CardContent>
                      <div className="record-item-title">{r.exercise}</div>
                      <div className="record-item-meta">
                        {r.duration_minutes != null
                          ? `${r.duration_minutes}分`
                          : `${r.weight}kg × ${r.reps}回 × ${r.sets}セット`}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {!hasAnyGoal && (
        <div className="element-container">
          <div className="alert alert-info">
            まだ目標が設定されていません。「目標管理」タブから長期・週間・月間の目標を設定しましょう。
          </div>
          <Button onClick={onNavigateToGoals}>🎯 目標を設定する</Button>
        </div>
      )}

      {weeklyProgress && (
        <div className="element-container">
          <h4>📆 週間目標</h4>
          <div className="row" style={{ justifyContent: 'center' }}>
            <GoalRing
              label="今週の実施"
              sublabel={`${weeklyProgress.current} / ${weeklyProgress.target} 回`}
              percent={weeklyProgress.percent}
              size={140}
            />
          </div>
        </div>
      )}

      {longTermHighlights.length > 0 && (
        <div className="element-container">
          <h4>🏆 長期目標</h4>
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

      {monthlyHighlights.length > 0 && (
        <div className="element-container">
          <h4>🗓️ 月間目標</h4>
          <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            {monthlyHighlights.map(({ goal, progress }) => (
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
