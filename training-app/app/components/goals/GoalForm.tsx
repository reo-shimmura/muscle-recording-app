import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/ui/number-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GoalMetric } from '../../types';
import Icon from '../Icon';
import { CARDIO_CATEGORY } from '../../constants/exercises';
import { CARDIO_METRIC_OPTIONS, STRENGTH_METRIC_OPTIONS, type MetricOption } from '../../constants/goals';

interface Props {
  exercises: string[];
  /** 種目名 → カテゴリ（有酸素の種目かどうかの判定に使う） */
  categoryMap: Record<string, string>;
  onAdd: (goal: { exercise: string; metric: GoalMetric; target_value: number; unit: string }) => void;
}

// 指標ごとの目標値の初期値と入力の刻み
const DEFAULT_TARGET: Record<GoalMetric, number> = {
  max_weight: 60,
  total_sets: 100,
  total_reps: 1000,
  total_distance: 100,
  total_duration: 600,
};

/** 種目に合った指標の一覧（ランニングなど有酸素は累計距離・累計時間、それ以外は筋トレの指標） */
function metricOptionsFor(exercise: string, categoryMap: Record<string, string>): MetricOption[] {
  return categoryMap[exercise] === CARDIO_CATEGORY ? CARDIO_METRIC_OPTIONS : STRENGTH_METRIC_OPTIONS;
}

export default function GoalForm({ exercises, categoryMap, onAdd }: Props) {
  const initialExercise = exercises[0] || '';
  const [exercise, setExercise] = useState(initialExercise);
  const [metric, setMetric] = useState<GoalMetric>(metricOptionsFor(initialExercise, categoryMap)[0].value);
  const [targetValue, setTargetValue] = useState(DEFAULT_TARGET[metric]);

  const metricOptions = metricOptionsFor(exercise, categoryMap);
  const selectedMetric = metricOptions.find((m) => m.value === metric) ?? metricOptions[0];

  // 種目を変えたら、その種目に合った指標の先頭と初期値に戻す
  const handleExerciseChange = (value: string) => {
    const nextMetric = metricOptionsFor(value, categoryMap)[0].value;
    setExercise(value);
    setMetric(nextMetric);
    setTargetValue(DEFAULT_TARGET[nextMetric]);
  };

  const handleMetricChange = (value: GoalMetric) => {
    setMetric(value);
    setTargetValue(DEFAULT_TARGET[value]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise.trim()) {
      alert('種目を選択してください。');
      return;
    }
    onAdd({ exercise, metric: selectedMetric.value, target_value: targetValue, unit: selectedMetric.unit });
    handleExerciseChange(initialExercise);
  };

  return (
    <form onSubmit={handleSubmit} className="element-container">
      <div className="grid-cols-2">
        <div>
          <label>対象種目</label>
          <Select value={exercise} onValueChange={(value) => handleExerciseChange(value ?? '')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="種目を選択してください" />
            </SelectTrigger>
            <SelectContent>
              {exercises.map((ex) => (
                <SelectItem key={ex} value={ex}>{ex}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label>指標</label>
          <Select value={selectedMetric.value} onValueChange={(value) => handleMetricChange(value as GoalMetric)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value: GoalMetric) => metricOptions.find((m) => m.value === value)?.label ?? ''}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {metricOptions.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label>目標値（{selectedMetric.unit}）</label>
          {/* 最小値と刻みを揃える（重量・距離は .0 / .5、回数・時間は整数） */}
          <NumberInput
            min={selectedMetric.step}
            step={selectedMetric.step}
            value={targetValue}
            onChange={setTargetValue}
            required
          />
        </div>
      </div>
      <Button type="submit" className="mt-4">
        <Icon name="target" color="currentColor" />長期目標を設定する
      </Button>
    </form>
  );
}
