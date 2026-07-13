'use client'

import { useState } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { DailyStat } from '../../lib/detailsStats';

interface Props {
  data: DailyStat[];
}

type ChartMode = 'volume' | 'maxWeight';

const CHART_MODES: ChartMode[] = ['volume', 'maxWeight'];

const CHART_CONFIG: ChartConfig = {
  volume: { label: 'ボリューム推移 (重量×回数×セット数)', color: '#3b82f6' },
  maxWeight: { label: '最大重量推移', color: '#10b981' },
};

/** 日別のボリューム推移／最大重量推移をボタンで切り替えて表示する折れ線グラフ */
export default function StatsChart({ data }: Props) {
  const [mode, setMode] = useState<ChartMode>('volume');

  return (
    <div className="element-container">
      <div className="row" style={{ marginBottom: '0.5rem' }}>
        {CHART_MODES.map((key) => (
          <Button
            key={key}
            type="button"
            variant={mode === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode(key)}
          >
            {CHART_CONFIG[key].label}
          </Button>
        ))}
      </div>

      <ChartContainer config={CHART_CONFIG} className="aspect-auto h-[300px] w-full">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey={mode}
            name={String(CHART_CONFIG[mode].label)}
            stroke={`var(--color-${mode})`}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
