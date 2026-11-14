'use client'

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import OptionButtons from './OptionButtons';
import { summarizeByPeriod, type PeriodUnit } from '../../lib/analysis/periodSummary';
import { changeRate } from '../../lib/analysis/common';
import { toDateStr } from '../../lib/goalsProgress';
import type { TrainingRecord } from '../../types';

interface Props {
  records: TrainingRecord[];
}

type Metric = 'days' | 'volume' | 'sets';

// 直近何期間分を表示するか
const PERIOD_COUNT = 12;

const UNIT_OPTIONS: { key: PeriodUnit; label: string }[] = [
  { key: 'week', label: '週ごと' },
  { key: 'month', label: '月ごと' },
];

const METRIC_OPTIONS: { key: Metric; label: string }[] = [
  { key: 'days', label: '実施日数' },
  { key: 'volume', label: '負荷量' },
  { key: 'sets', label: 'セット数' },
];

const CHART_CONFIG: ChartConfig = {
  days: { label: '実施日数', color: '#10b981' },
  volume: { label: '負荷量 (kg)', color: '#3b82f6' },
  sets: { label: 'セット数', color: '#f59e0b' },
};

/** 増減率を「+12.5%」の形で表示する（比較できないときは「—」） */
function formatRate(rate: number | null): string {
  if (rate === null) return '—';
  return `${rate > 0 ? '+' : ''}${rate}%`;
}

/** 1. 週・月ごとの推移：実施日数・負荷量・セット数を棒グラフで並べ、前の期間との増減を出す */
export default function PeriodTrendCard({ records }: Props) {
  const [unit, setUnit] = useState<PeriodUnit>('week');
  const [metric, setMetric] = useState<Metric>('days');
  const today = toDateStr(new Date());

  const data = useMemo(() => summarizeByPeriod(records, unit, today, PERIOD_COUNT), [records, unit, today]);
  const current = data[data.length - 1];
  const previous = data[data.length - 2];
  const unitName = unit === 'week' ? '週' : '月';

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>📆 週・月ごとの推移</CardTitle>
      </CardHeader>
      <CardContent>
        <OptionButtons options={UNIT_OPTIONS} selected={unit} onSelect={setUnit} />
        <OptionButtons options={METRIC_OPTIONS} selected={metric} onSelect={setMetric} />

        <div style={{ marginBottom: '0.5rem' }}>
          今{unitName}: <b>{Math.round(current[metric]).toLocaleString()}</b>
          <span className="small-muted">
            {'　'}前{unitName}比 {formatRate(changeRate(current[metric], previous[metric]))}
          </span>
        </div>

        <ChartContainer config={CHART_CONFIG} className="aspect-auto h-[220px] w-full">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
            <YAxis tickLine={false} axisLine={false} width={44} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey={metric} fill={`var(--color-${metric})`} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
        <div className="small-muted" style={{ fontSize: '0.75rem' }}>
          直近{PERIOD_COUNT}{unitName}分。{unit === 'week' ? '週は月曜始まりで、' : ''}右端が今{unitName}（途中経過）です。
        </div>
      </CardContent>
    </Card>
  );
}
