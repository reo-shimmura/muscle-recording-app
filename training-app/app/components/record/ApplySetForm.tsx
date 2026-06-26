import React, { useState } from 'react';
import SetDraftItem from './SetDraftItem';
import type { WorkoutSetItem, WorkoutSetTemplate, TrainingRecord, AlertMessage } from '../../types';

interface Props {
  setTemplates: WorkoutSetTemplate[];
  selectedTemplateId: string;
  setItemsDraft: WorkoutSetItem[];
  loading: boolean;
  onTemplateSelect: (id: string) => void;
  onDraftChange: React.Dispatch<React.SetStateAction<WorkoutSetItem[]>>;
  onSave: (records: TrainingRecord[]) => Promise<boolean>;
  showMessage: (msg: AlertMessage) => void;
}

/** 保存済みセットを選択して一括記録するフォーム */
export default function ApplySetForm({
  setTemplates,
  selectedTemplateId,
  setItemsDraft,
  loading,
  onTemplateSelect,
  onDraftChange,
  onSave,
  showMessage,
}: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState('');

  const handleDraftChange = (index: number, field: keyof WorkoutSetItem, value: string | number) => {
    onDraftChange((prev) =>
      prev.map((row, rowIdx) => (rowIdx === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) {
      showMessage({ type: 'error', text: 'セットを選択してください。' });
      return;
    }
    if (setItemsDraft.length === 0) {
      showMessage({ type: 'error', text: 'セット内容が空です。' });
      return;
    }

    const payloads: TrainingRecord[] = setItemsDraft.map((item) => ({
      date,
      exercise: item.exercise.trim(),
      weight: Math.max(0, Number(item.weight)),
      reps: Math.max(1, Number(item.reps)),
      sets: Math.max(1, Number(item.sets)),
      memo: memo.trim(),
    }));

    if (payloads.some((p) => !p.exercise)) {
      showMessage({ type: 'error', text: 'セット内の各種目名を入力してください。' });
      return;
    }

    const success = await onSave(payloads);
    if (success) setMemo('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h4>セットを選択して一括記録</h4>
      <div className="grid-cols-2">
        <div className="element-container">
          <label>セット選択</label>
          <select value={selectedTemplateId} onChange={(e) => onTemplateSelect(e.target.value)}>
            <option value="">-- 保存済みセットを選択 --</option>
            {setTemplates.map((template) => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>
        </div>
        <div className="element-container">
          <label>日付</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>

      {setItemsDraft.map((item, idx) => (
        <SetDraftItem key={`draft-${idx}`} item={item} index={idx} onChange={handleDraftChange} />
      ))}

      <div className="element-container">
        <label>メモ（任意）</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="セット全体に共通のメモ"
        />
      </div>

      <button type="submit" disabled={loading || setItemsDraft.length === 0}>
        {loading ? <span className="spinner"></span> : '🚀'} セット内容を一括記録
      </button>
    </form>
  );
}
