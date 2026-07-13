'use client'

import { useState } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { DailyStat } from '../../lib/detailsStats';

interface Props {
  data: DailyStat[];
  isCardio: boolean;
}

type StrengthMode = 'volume' | 'maxWeight';
type CardioMode = 'durationMinutes' | 'maxDurationMinutes';

const STRENGTH_MODES: StrengthMode[] = ['volume', 'maxWeight'];
const CARDIO_MODES: CardioMode[] = ['durationMinutes', 'maxDurationMinutes'];

const STRENGTH_CONFIG: ChartConfig = {
  volume: { label: 'ボリューム推移 (重量×回数×セット数)', color: '#3b82f6' },
  maxWeight: { label: '最大重量推移', color: '#10b981' },
};

const CARDIO_CONFIG: ChartConfig = {
  durationMinutes: { label: '合計時間推移 (分)', color: '#3b82f6' },
  maxDurationMinutes: { label: '最大時間推移 (分)', color: '#10b981' },
};

/** 日別の統計を折れ線グラフで表示する（有酸素種目は時間、それ以外はボリューム/重量） */
export default function StatsChart({ data, isCardio }: Props) {
  const modes = isCardio ? CARDIO_MODES : STRENGTH_MODES;
  const config = isCardio ? CARDIO_CONFIG : STRENGTH_CONFIG;
  const [mode, setMode] = useState<StrengthMode | CardioMode>(modes[0]);

  return (
    <div className="element-container">
      <div className="row" style={{ marginBottom: '0.5rem' }}>
        {modes.map((key) => (
          <Button
            key={key}
            type="button"
            variant={mode === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode(key)}
          >
            {config[key].label}
          </Button>
        ))}
      </div>

      <ChartContainer config={config} className="aspect-auto h-[300px] w-full">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey={mode}
            name={String(config[mode].label)}
            stroke={`var(--color-${mode})`}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
