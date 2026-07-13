'use client'

import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DailyStat } from '../../lib/detailsStats';

interface Props {
  data: DailyStat[];
}

type ChartMode = 'volume' | 'maxWeight';

const CHART_CONFIG: Record<ChartMode, { label: string; dataKey: keyof DailyStat; color: string }> = {
  volume: { label: 'ボリューム推移 (重量×回数×セット数)', dataKey: 'volume', color: '#3b82f6' },
  maxWeight: { label: '最大重量推移', dataKey: 'maxWeight', color: '#10b981' },
};

/** 日別のボリューム推移／最大重量推移をボタンで切り替えて表示する折れ線グラフ */
export default function StatsChart({ data }: Props) {
  const [mode, setMode] = useState<ChartMode>('volume');
  const config = CHART_CONFIG[mode];

  return (
    <div className="element-container">
      <div className="tabs" style={{ borderBottom: 'none', marginBottom: '0.5rem' }}>
        {(Object.keys(CHART_CONFIG) as ChartMode[]).map((key) => (
          <button
            key={key}
            type="button"
            className={`tab-btn ${mode === key ? 'active' : ''}`}
            onClick={() => setMode(key)}
          >
            {CHART_CONFIG[key].label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey={config.dataKey}
            name={config.label}
            stroke={config.color}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
