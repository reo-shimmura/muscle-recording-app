import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GoalMetric } from '../../types';

interface Props {
  exercises: string[];
  onAdd: (goal: { exercise: string; metric: GoalMetric; target_value: number; unit: string }) => void;
}

const METRIC_OPTIONS: { value: GoalMetric; label: string; unit: string }[] = [
  { value: 'max_weight', label: '最大重量', unit: 'kg' },
  { value: 'total_sets', label: '累計セット数', unit: 'セット' },
  { value: 'total_reps', label: '累計回数', unit: '回' },
];

export default function GoalForm({ exercises, onAdd }: Props) {
  const [exercise, setExercise] = useState(exercises[0] || '');
  const [metric, setMetric] = useState<GoalMetric>('max_weight');
  const [targetValue, setTargetValue] = useState(60);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise.trim()) {
      alert('種目を選択してください。');
      return;
    }
    const unit = METRIC_OPTIONS.find((m) => m.value === metric)?.unit ?? '';
    onAdd({ exercise, metric, target_value: targetValue, unit });
    setExercise(exercises[0] || '');
    setTargetValue(60);
  };

  return (
    <form onSubmit={handleSubmit} className="element-container">
      <div className="grid-cols-2">
        <div>
          <label>対象種目</label>
          <Select value={exercise} onValueChange={(value) => setExercise(value ?? '')}>
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
          <Select value={metric} onValueChange={(value) => setMetric(value as GoalMetric)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value: GoalMetric) => METRIC_OPTIONS.find((m) => m.value === value)?.label ?? ''}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {METRIC_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label>目標値（{METRIC_OPTIONS.find((m) => m.value === metric)?.unit}）</label>
          <input
            type="number"
            min="1"
            value={targetValue}
            onChange={(e) => setTargetValue(Number(e.target.value))}
            required
          />
        </div>
      </div>
      <Button type="submit" className="mt-4">
        🎯 長期目標を設定する
      </Button>
    </form>
  );
}
