'use client'

import { useState } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { filterStatsByRange, type DailyStat, type RangeKey } from '../../lib/detailsStats';

interface Props {
  data: DailyStat[];
  isCardio: boolean;
}

type StrengthMode = 'totalVolume' | 'dailyVolume' | 'maxWeight' | 'setCount';
type CardioMode = 'totalDurationMinutes' | 'durationMinutes' | 'maxDurationMinutes' | 'sessionCount';

const STRENGTH_MODES: StrengthMode[] = ['totalVolume', 'dailyVolume', 'maxWeight', 'setCount'];
const CARDIO_MODES: CardioMode[] = ['totalDurationMinutes', 'durationMinutes', 'maxDurationMinutes', 'sessionCount'];

const STRENGTH_CONFIG: ChartConfig = {
  totalVolume: { label: '総負荷量', color: '#3b82f6' },
  dailyVolume: { label: '日別負荷量', color: '#6366f1' },
  maxWeight: { label: '最大重量', color: '#10b981' },
  setCount: { label: 'セット数', color: '#f59e0b' },
};

const CARDIO_CONFIG: ChartConfig = {
  totalDurationMinutes: { label: '総時間 (分)', color: '#3b82f6' },
  durationMinutes: { label: '日別時間 (分)', color: '#6366f1' },
  maxDurationMinutes: { label: '最大時間 (分)', color: '#10b981' },
  sessionCount: { label: '実施回数', color: '#f59e0b' },
};

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: '1w', label: '1週間' },
  { key: '2w', label: '2週間' },
  { key: '1m', label: '1か月' },
  { key: '3m', label: '3か月' },
  { key: 'all', label: '全期間' },
];

/** 日別の統計を折れ線グラフで表示する（有酸素種目は時間、それ以外はボリューム/重量ベースの4指標を切替） */
export default function StatsChart({ data, isCardio }: Props) {
  const modes = isCardio ? CARDIO_MODES : STRENGTH_MODES;
  const config = isCardio ? CARDIO_CONFIG : STRENGTH_CONFIG;
  const [mode, setMode] = useState<StrengthMode | CardioMode>(modes[0]);
  const [range, setRange] = useState<RangeKey>('all');

  const displayData = filterStatsByRange(data, range);

  return (
    <div className="element-container" style={{ marginTop: '1.5rem' }}>
      <label>表示範囲</label>
      <div className="row" style={{ marginBottom: '0.5rem' }}>
        {RANGE_OPTIONS.map(({ key, label }) => (
          <Button
            key={key}
            type="button"
            variant={range === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRange(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      <ChartContainer config={config} className="aspect-auto h-[300px] w-full">
        <LineChart data={displayData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
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

      <div className="row" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
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
    </div>
  );
}
