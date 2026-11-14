'use client'

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import OptionButtons from './OptionButtons';
import type { CategoryBalance } from '../../lib/analysis/categoryBalance';
import { COLORS } from '../../constants/colors';

interface Props {
  balances: CategoryBalance[];
}

type Metric = 'volume' | 'sets' | 'days';

const METRIC_OPTIONS: { key: Metric; label: string }[] = [
  { key: 'volume', label: '負荷量' },
  { key: 'sets', label: 'セット数' },
  { key: 'days', label: '日数' },
];

const CHART_CONFIG: ChartConfig = {
  volume: { label: '負荷量 (kg)', color: COLORS.primary },
  sets: { label: 'セット数', color: COLORS.caution },
  days: { label: '日数', color: COLORS.success },
};

/** 全体に占める割合（%、小数第1位まで） */
function shareOf(value: number, total: number): string {
  return total > 0 ? `${Math.round((value / total) * 1000) / 10}%` : '—';
}

/** 4. 部位別バランス：部位ごとの負荷量・セット数・日数を横棒グラフと構成比で比べる */
export default function CategoryBalanceCard({ balances }: Props) {
  const [metric, setMetric] = useState<Metric>('volume');
  const total = balances.reduce((sum, b) => sum + b[metric], 0);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>⚖️ 部位別バランス</CardTitle>
      </CardHeader>
      <CardContent>
        <OptionButtons options={METRIC_OPTIONS} selected={metric} onSelect={setMetric} />

        {total === 0 ? (
          <div className="small-muted">この期間の筋トレの記録がありません。</div>
        ) : (
          <>
            <ChartContainer config={CHART_CONFIG} className="aspect-auto w-full" style={{ height: balances.length * 36 + 24 }}>
              <BarChart data={balances} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} width={44} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey={metric} fill={`var(--color-${metric})`} radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ChartContainer>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
              {balances.map((b) => (
                <span key={b.category} style={{ color: b[metric] === 0 ? COLORS.warning : undefined }}>
                  {b.category} {shareOf(b[metric], total)}
                </span>
              ))}
            </div>
            <div className="small-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
              オレンジはこの期間に一度も鍛えていない部位です。有酸素は含みません。
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
