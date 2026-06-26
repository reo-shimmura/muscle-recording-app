import React, { useState } from 'react';
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
          <select value={exercise} onChange={(e) => setExercise(e.target.value)}>
            {exercises.map((ex) => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
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
      <button type="submit" style={{ marginTop: '1rem' }}>
        🎯 目標を設定する
      </button>
    </form>
  );
}
