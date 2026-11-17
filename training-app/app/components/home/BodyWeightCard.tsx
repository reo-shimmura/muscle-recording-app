'use client'

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { BodyWeight } from '../../types';
import { COLORS } from '../../constants/colors';
import Icon from '../Icon';

interface Props {
  bodyWeights: BodyWeight[];
}

const CHART_CONFIG: ChartConfig = {
  weight_kg: { label: '体重 (kg)', color: COLORS.bodyWeight },
};

// グラフが見やすくなるよう、直近30件（概ね1か月分）だけを表示する
const CHART_HISTORY_LIMIT = 30;

/** ホーム画面：体重の最新値・前回比・推移グラフを表示する（記録は「記録追加」タブの「体重」から行う） */
export default function BodyWeightCard({ bodyWeights }: Props) {
  const latest = bodyWeights[bodyWeights.length - 1] ?? null;
  const previous = bodyWeights[bodyWeights.length - 2] ?? null;
  const diff = latest && previous ? Math.round((latest.weight_kg - previous.weight_kg) * 10) / 10 : null;
  const chartData = bodyWeights.slice(-CHART_HISTORY_LIMIT);

  return (
    <div className="element-container">
      <h4><Icon name="scale" />体重</h4>

      {latest ? (
        <div className="row" style={{ alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 700 }}>{latest.weight_kg}kg</span>
          {diff !== null && (
            <span className="small-muted">
              {diff > 0 ? `+${diff}` : diff}kg（前回比）
            </span>
          )}
          <span className="small-muted">{latest.date}</span>
        </div>
      ) : (
        <p className="small-muted">まだ体重が記録されていません。「記録追加」タブの「体重」から記録できます。</p>
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
    </div>
  );
}
