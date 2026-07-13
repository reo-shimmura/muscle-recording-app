import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Goal } from '../../types';

interface Props {
  exercises: string[];
  onAdd: (goal: Goal) => void;
}

export default function GoalForm({ exercises, onAdd }: Props) {
  const [exercise, setExercise] = useState(exercises[0] || '');
  const [value, setValue] = useState(15);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise.trim()) {
      alert('種目を選択してください。');
      return;
    }
    onAdd({ id: Date.now(), exercise, value, unit: 'sets' });
    setExercise(exercises[0] || '');
    setValue(15);
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
          <label>目標値（総セット数）</label>
          <input
            type="number"
            min="1"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            required
          />
        </div>
      </div>
      <Button type="submit" className="mt-4">
        🎯 目標を設定する
      </Button>
    </form>
  );
}
