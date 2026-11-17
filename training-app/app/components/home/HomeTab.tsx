import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import GoalProgressCard from './GoalProgressCard';
import BodyWeightCard from './BodyWeightCard';
import MotivationCard from './MotivationCard';
import LastTrainedCard from './LastTrainedCard';
import CalendarGrid from '../calendar/CalendarGrid';
import { buildExerciseCategoryMap } from '../../constants/exercises';
import { groupRecordsByExercise } from '../../lib/groupRecords';
import { buildHabitItems, buildLongTermItems, buildMonthlyItems } from '../../lib/goalItems';
import { calcWeeklyGoalStreak } from '../../lib/streak';
import type { LongTermGoal, FrequencyGoal, TrainingRecord, CustomExercise, BodyWeight, ProteinIntake } from '../../types';
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

  // 目標の進捗カード（横棒）の項目。習慣の3つは目標が未設定でも常に表示する
  const habitItems = useMemo(
    () => buildHabitItems({ weeklyGoal, habitGoals, records, proteinIntakes, bodyWeights }),
    [weeklyGoal, habitGoals, records, proteinIntakes, bodyWeights]
  );
  // 長期目標は、達成率が低い（伸びしろが大きい）順に主要な目標だけを抜粋する
  const longTermItems = useMemo(() => buildLongTermItems(longTermGoals, records, MAX_ITEMS), [longTermGoals, records]);
  const monthlyItems = useMemo(
    () => buildMonthlyItems(monthlyGoals, records, categoryMap),
    [monthlyGoals, records, categoryMap]
  );
  const weeklyGoalStreak = useMemo(() => calcWeeklyGoalStreak(weeklyGoal, records), [weeklyGoal, records]);

  return (
    <div>
      <h3><Icon name="home" />ホーム</h3>

      <MotivationCard records={records} />

      <GoalProgressCard
        habitItems={habitItems}
        longTermItems={longTermItems}
        monthlyItems={monthlyItems}
        weeklyGoalStreak={weeklyGoalStreak}
        onNavigateToGoals={onNavigateToGoals}
      />

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
    </div>
  );
}
