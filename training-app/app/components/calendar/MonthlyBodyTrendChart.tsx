'use client'

import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import Icon from '../Icon';
import { hasBodyTrendData, type DailyBodyTrend } from '../../lib/monthlyTrend';
import { COLORS } from '../../constants/colors';

interface Props {
  trend: DailyBodyTrend[];
  /** 表示中の月（例: 11月） */
  monthLabel: string;
}

const CHART_CONFIG: ChartConfig = {
  protein: { label: 'プロテイン (g)', color: COLORS.protein },
  target: { label: '目安 (g)', color: '#9ca3af' },
  bodyWeight: { label: '体重 (kg)', color: COLORS.bodyWeight },
};

/** カレンダーの下：表示中の月のプロテイン（棒・左軸）と目安（点線）、体重（線・右軸）の推移 */
export default function MonthlyBodyTrendChart({ trend, monthLabel }: Props) {
  return (
    <div className="element-container">
      <h4><Icon name="chart-up" />{monthLabel}のプロテイン・体重の推移</h4>

      {!hasBodyTrendData(trend) ? (
        <div className="small-muted">この月のプロテイン・体重の記録はありません。「記録追加」タブから記録できます。</div>
      ) : (
        <>
          <ChartContainer config={CHART_CONFIG} className="aspect-auto h-[240px] w-full">
            <ComposedChart data={trend} margin={{ top: 8, right: 0, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
              <YAxis yAxisId="protein" tickLine={false} axisLine={false} width={36} allowDecimals={false} />
              <YAxis
                yAxisId="bodyWeight"
                orientation="right"
                domain={['dataMin - 1', 'dataMax + 1']}
                tickLine={false}
                axisLine={false}
                width={36}
                allowDecimals={false}
              />
              <ChartTooltip
                content={<ChartTooltipContent labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''} />}
              />
              <Bar yAxisId="protein" dataKey="protein" fill="var(--color-protein)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
              <Line
                yAxisId="protein"
                type="stepAfter"
                dataKey="target"
                stroke="var(--color-target)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              {/* 体重を測っていない日は線を途切れさせず、前後をつなぐ */}
              <Line
                yAxisId="bodyWeight"
                type="monotone"
                dataKey="bodyWeight"
                stroke="var(--color-bodyWeight)"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
                isAnimationActive={false}
              />
            </ComposedChart>
          </ChartContainer>
          <div className="small-muted" style={{ fontSize: '0.75rem' }}>
            棒がプロテイン（左の目盛り）、点線がその日の目安（筋トレした日は2杯・休みの日は1杯）、線が体重（右の目盛り）です。
          </div>
        </>
      )}
    </div>
  );
}
