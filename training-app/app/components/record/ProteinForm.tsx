'use client'

import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import ProteinMeter from './ProteinMeter';
import Icon from '../Icon';
import { dailyProteinTarget, hasTrainingOn, ratioToGrams, sumProteinByDate } from '../../lib/protein';
import { toDateStr } from '../../lib/goalsProgress';
import { PROTEIN_SCOOP_G, PROTEIN_SLIDER_STEP, PROTEIN_TARGET_CUPS } from '../../constants/protein';
import type { ProteinIntake, TrainingRecord } from '../../types';

interface Props {
  records: TrainingRecord[];
  proteinIntakes: ProteinIntake[];
  loading: boolean;
  onSave: (date: string, amountG: number) => Promise<boolean>;
  onDelete: (id: number) => void;
}

/** 1杯のうちの割合を「70%」のように表示する */
function percentLabel(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/** 記録追加タブ「プロテイン」：日付と、1杯（30g）のうち飲んだ割合をつまみで選んで記録する */
export default function ProteinForm({ records, proteinIntakes, loading, onSave, onDelete }: Props) {
  const [date, setDate] = useState(() => toDateStr(new Date()));
  const [ratio, setRatio] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const grams = ratioToGrams(ratio);
  const consumed = useMemo(() => sumProteinByDate(proteinIntakes).get(date) ?? 0, [proteinIntakes, date]);
  const target = dailyProteinTarget(records, date);
  const trained = hasTrainingOn(records, date);
  const dayIntakes = proteinIntakes.filter((p) => p.date === date);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!date || grams <= 0) return;

    setSubmitting(true);
    const ok = await onSave(date, grams);
    setSubmitting(false);
    if (ok) setRatio(1);
  };

  const handleDelete = (intake: ProteinIntake) => {
    if (window.confirm(`${intake.date} のプロテイン記録（${intake.amount_g}g）を削除しますか？`)) {
      onDelete(intake.id);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="element-container">
        <label htmlFor="protein-date">日付</label>
        <input id="protein-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div className="element-container">
        <label htmlFor="protein-ratio">
          飲んだ量：1杯（{PROTEIN_SCOOP_G}g）の <b>{percentLabel(ratio)}</b>（{grams}g）
        </label>
        <input
          id="protein-ratio"
          type="range"
          min={PROTEIN_SLIDER_STEP}
          max={1}
          step={PROTEIN_SLIDER_STEP}
          value={ratio}
          onChange={(e) => setRatio(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--primary)' }}
        />
        <div className="small-muted" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
          <span>少し</span>
          <span>半分</span>
          <span>1杯</span>
        </div>
      </div>

      <div className="element-container">
        <label>
          この日の摂取量
          <span className="small-muted" style={{ fontWeight: 400 }}>
            （目安：{trained ? `筋トレした日は${PROTEIN_TARGET_CUPS.training}杯` : `休みの日は${PROTEIN_TARGET_CUPS.rest}杯`}）
          </span>
        </label>
        <ProteinMeter consumed={consumed} adding={grams} target={target} />
      </div>

      <div className="element-container">
        <Button type="submit" disabled={submitting || loading}>
          {submitting ? <span className="spinner"></span> : <Icon name="shaker" color="currentColor" />}記録する
        </Button>
      </div>

      {dayIntakes.length > 0 && (
        <div className="element-container">
          <label>この日の記録</label>
          {dayIntakes.map((intake, i) => (
            <div key={intake.id} className="row" style={{ alignItems: 'center', gap: '0.5rem' }}>
              <span>{i + 1}回目：{intake.amount_g}g</span>
              <Button type="button" variant="ghost" size="xs" onClick={() => handleDelete(intake)}>
                削除
              </Button>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
