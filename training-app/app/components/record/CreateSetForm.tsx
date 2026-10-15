import React from 'react';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/ui/number-input';
import type { WorkoutSetItem, AlertMessage } from '../../types';

interface Props {
  newTemplateName: string;
  newTemplateItems: WorkoutSetItem[];
  allExercisesFlat: string[];
  onNameChange: (name: string) => void;
  onItemsChange: React.Dispatch<React.SetStateAction<WorkoutSetItem[]>>;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onSave: () => void;
  showMessage: (msg: AlertMessage) => void;
}

/** 新規セットテンプレートを作成するフォーム */
export default function CreateSetForm({
  newTemplateName,
  newTemplateItems,
  allExercisesFlat,
  onNameChange,
  onItemsChange,
  onAddRow,
  onRemoveRow,
  onSave,
}: Props) {
  const handleItemChange = (index: number, field: keyof WorkoutSetItem, value: string | number) => {
    onItemsChange((prev) =>
      prev.map((row, rowIdx) => (rowIdx === index ? { ...row, [field]: value } : row))
    );
  };

  return (
    <div className="element-container">
      <h4>セットを作成</h4>
      <div className="grid-cols-2">
        <div>
          <label>セット名</label>
          <input
            type="text"
            value={newTemplateName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="例: 胸トレA"
          />
        </div>
        <div className="row" style={{ alignItems: 'end' }}>
          <Button type="button" variant="outline" onClick={onAddRow}>種目を追加</Button>
          <Button type="button" onClick={onSave}>セットを保存</Button>
        </div>
      </div>

      <datalist id="exercise-list">
        {allExercisesFlat.map((ex) => (
          <option key={ex} value={ex} />
        ))}
      </datalist>

      {newTemplateItems.map((item, idx) => (
        <div className="grid-cols-2" key={`new-template-${idx}`} style={{ marginBottom: '1.5rem' }}>
          <div>
            <label>種目 {idx + 1}</label>
            <input
              type="text"
              list="exercise-list"
              value={item.exercise}
              onChange={(e) => handleItemChange(idx, 'exercise', e.target.value)}
              placeholder="例: ベンチプレス"
            />
          </div>
          <div className="row" style={{ alignItems: 'end' }}>
            <div>
              <label>重量</label>
              <NumberInput
                min="0"
                step="0.5"
                value={item.weight}
                onChange={(value) => handleItemChange(idx, 'weight', value)}
              />
            </div>
            <div>
              <label>回数</label>
              <NumberInput
                min="1"
                value={item.reps}
                onChange={(value) => handleItemChange(idx, 'reps', value)}
              />
            </div>
            <div style={{ marginRight: '1rem' }}>
              <label>セット数</label>
              <NumberInput
                min="1"
                value={item.sets}
                onChange={(value) => handleItemChange(idx, 'sets', value)}
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={() => onRemoveRow(idx)}
              disabled={newTemplateItems.length === 1}
            >
              削除
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
