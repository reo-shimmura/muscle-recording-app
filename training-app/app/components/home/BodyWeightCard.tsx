'use client'

import { useState, type FormEvent } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { BodyWeight } from '../../types';

interface Props {
  bodyWeights: BodyWeight[];
  loading: boolean;
  onSave: (date: string, weightKg: number) => Promise<boolean>;
  onDelete: (id: number) => void;
}

const CHART_CONFIG: ChartConfig = {
  weight_kg: { label: '体重 (kg)', color: '#8b5cf6' },
};

// グラフが見やすくなるよう、直近30件（概ね1か月分）だけを表示する
const CHART_HISTORY_LIMIT = 30;

/** ホーム画面：体重の最新値・推移グラフ・その場での記録フォームを表示する */
export default function BodyWeightCard({ bodyWeights, loading, onSave, onDelete }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [weightKg, setWeightKg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const latest = bodyWeights[bodyWeights.length - 1] ?? null;
  const previous = bodyWeights[bodyWeights.length - 2] ?? null;
  const diff = latest && previous ? Math.round((latest.weight_kg - previous.weight_kg) * 10) / 10 : null;
  const chartData = bodyWeights.slice(-CHART_HISTORY_LIMIT);

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
    <div className="element-container">
      <h4>⚖️ 体重</h4>

      {latest && (
        <div className="row" style={{ alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 700 }}>{latest.weight_kg}kg</span>
          {diff !== null && (
            <span className="small-muted">
              {diff > 0 ? `+${diff}` : diff}kg（前回比）
            </span>
          )}
          <span className="small-muted">{latest.date}</span>
          <Button type="button" variant="ghost" size="xs" onClick={handleDeleteLatest}>
            削除
          </Button>
        </div>
      )}

      {chartData.length >= 2 && (
        <ChartContainer config={CHART_CONFIG} className="aspect-auto h-[160px] w-full mt-2">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} domain={['auto', 'auto']} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="weight_kg"
              name="体重 (kg)"
              stroke="var(--color-weight_kg)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ChartContainer>
      )}

      {!latest && <p className="small-muted">まだ体重が記録されていません。</p>}

      <form onSubmit={handleSubmit} className="row mt-2" style={{ alignItems: 'flex-end' }}>
        <div>
          <label htmlFor="body-weight-date">日付</label>
          <input id="body-weight-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
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
        </div>
        <Button type="submit" disabled={submitting || loading}>
          {submitting ? '保存中...' : '記録する'}
        </Button>
      </form>
    </div>
  );
}
