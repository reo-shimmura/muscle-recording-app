'use client'

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CalendarGrid from './CalendarGrid';
import MonthlyBodyTrendChart from './MonthlyBodyTrendChart';
import type { BodyWeight, FoodIntake, TrainingRecord } from '../../types';
import Icon from '../Icon';
import { formatRecordDetail } from '../../lib/recordFormat';
import { groupRecordsByExercise } from '../../lib/groupRecords';
import { buildMonthlyBodyTrend } from '../../lib/monthlyTrend';
import { dailyProteinTarget } from '../../lib/protein';
import { FOOD_BY_KEY, formatFoodQuantity } from '../../constants/foods';

interface Props {
  records: TrainingRecord[];
  foodIntakes: FoodIntake[];
  bodyWeights: BodyWeight[];
}

/** カレンダータブ：月次表示・日付別の記録（筋トレ・プロテイン・体重）と、月のプロテイン・体重の推移 */
export default function CalendarTab({ records, foodIntakes, bodyWeights }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const markers = useMemo(
    () => ({
      // たんぱく質の記録（プロテイン・食事）がある日に印を付ける
      proteinDates: new Set(foodIntakes.map((p) => p.date)),
      bodyWeightDates: new Set(bodyWeights.map((b) => b.date)),
    }),
    [foodIntakes, bodyWeights]
  );
  const trend = useMemo(
    () => buildMonthlyBodyTrend(currentYear, currentMonth, foodIntakes, bodyWeights, records),
    [currentYear, currentMonth, foodIntakes, bodyWeights, records]
  );

  // 同じ種目の記録を1ブロックにまとめる（登場順を維持）
  const groupedRecords = groupRecordsByExercise(selectedDate ? records.filter((r) => r.date === selectedDate) : []);
  const dayIntakes = selectedDate ? foodIntakes.filter((p) => p.date === selectedDate) : [];
  const dayProteinTotal = Math.round(dayIntakes.reduce((sum, p) => sum + p.protein_g, 0) * 10) / 10;
  const dayProteinTarget = selectedDate ? dailyProteinTarget(records, bodyWeights, selectedDate) : null;
  const dayBodyWeight = selectedDate ? bodyWeights.find((b) => b.date === selectedDate) ?? null : null;
  const hasAnyRecord = groupedRecords.length > 0 || dayIntakes.length > 0 || dayBodyWeight !== null;

  return (
    <div>
      <h3><Icon name="calendar" />トレーニングカレンダー</h3>
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
        markers={markers}
      />

      <MonthlyBodyTrendChart trend={trend} monthLabel={`${currentMonth + 1}月`} />

      <Dialog open={!!selectedDate} onOpenChange={(open) => { if (!open) setSelectedDate(null); }}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle><Icon name="training-log" />{selectedDate} の記録</DialogTitle>
          </DialogHeader>
          {!hasAnyRecord && <div className="small-muted">この日の記録はありません。</div>}

          {groupedRecords.map((group) => (
            <Card key={group.exercise} className="mb-3 border-l-4 border-l-primary">
              <CardContent>
                <div className="record-item-title">{group.exercise}</div>
                {group.records.map((r) => (
                  <div key={r.id}>
                    <div className="record-item-meta">
                      {formatRecordDetail(r)}
                    </div>
                    {r.memo && <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>{r.memo}</div>}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {selectedDate && dayIntakes.length > 0 && (
            <Card className="mb-3">
              <CardContent>
                <div className="record-item-title"><Icon name="shaker" />たんぱく質</div>
                <div className="record-item-meta">
                  合計 {dayProteinTotal}g{dayProteinTarget ? `（目安 ${dayProteinTarget.grams}g）` : ''}
                </div>
                <div className="small-muted" style={{ fontSize: '0.85rem' }}>
                  {dayIntakes
                    .map((p) => `${FOOD_BY_KEY[p.food_key]?.label ?? p.food_key} ${formatFoodQuantity(p.food_key, p.quantity)}（${p.protein_g}g）`)
                    .join(' / ')}
                </div>
              </CardContent>
            </Card>
          )}

          {dayBodyWeight && (
            <Card className="mb-3">
              <CardContent>
                <div className="record-item-title"><Icon name="scale" />体重</div>
                <div className="record-item-meta">{dayBodyWeight.weight_kg}kg</div>
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
