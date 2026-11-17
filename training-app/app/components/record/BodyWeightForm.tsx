'use client'

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '../Icon';
import { toDateStr } from '../../lib/goalsProgress';
import type { BodyWeight } from '../../types';

interface Props {
  bodyWeights: BodyWeight[];
  loading: boolean;
  onSave: (date: string, weightKg: number) => Promise<boolean>;
  onDelete: (id: number) => void;
}

/** 記録追加タブ「体重」：日付と体重を記録する（ホーム画面にあった入力フォームを移したもの） */
export default function BodyWeightForm({ bodyWeights, loading, onSave, onDelete }: Props) {
  // 日付はローカル時刻の今日にする（UTC だと朝9時前に前日になるため）
  const [date, setDate] = useState(() => toDateStr(new Date()));
  const [weightKg, setWeightKg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const latest = bodyWeights[bodyWeights.length - 1] ?? null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const value = Number(weightKg);
    if (!date || !weightKg || !Number.isFinite(value)) return;

    setSubmitting(true);
    const ok = await onSave(date, value);
    setSubmitting(false);
    if (ok) setWeightKg('');
  };

  const handleDeleteLatest = () => {
    if (!latest) return;
    if (window.confirm(`${latest.date} の体重記録（${latest.weight_kg}kg）を削除しますか？`)) {
      onDelete(latest.id);
    }
  };

  return (
    <div>
      {latest && (
        <div className="element-container">
          <label>最新の記録</label>
          <div className="row" style={{ alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{latest.weight_kg}kg</span>
            <span className="small-muted">{latest.date}</span>
            <Button type="button" variant="ghost" size="xs" onClick={handleDeleteLatest}>
              削除
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="element-container">
          <label htmlFor="body-weight-date">日付</label>
          <input id="body-weight-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="element-container">
          <label htmlFor="body-weight-value">体重 (kg)</label>
          <input
            id="body-weight-value"
            type="number"
            step="0.1"
            min="1"
            max="500"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            required
          />
          <div className="small-muted" style={{ fontSize: '0.75rem' }}>同じ日付で記録すると、その日の体重を上書きします。</div>
        </div>
        <div className="element-container">
          <Button type="submit" disabled={submitting || loading}>
            {submitting ? <span className="spinner"></span> : <Icon name="scale" color="currentColor" />}記録する
          </Button>
        </div>
      </form>
    </div>
  );
}
