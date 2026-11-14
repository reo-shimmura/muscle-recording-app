import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { WeeklyBodyStat } from '../../lib/analysis/bodyComposition';
import { COLORS } from '../../constants/colors';
import Icon from '../Icon';

interface Props {
  weeklyStats: WeeklyBodyStat[];
}

const CHART_CONFIG: ChartConfig = {
  volume: { label: '負荷量 (kg)', color: COLORS.primaryLight },
  bodyWeight: { label: '体重 (kg)', color: COLORS.bodyWeight },
};

/** 10. 体重と負荷量の重ね合わせ：週ごとの負荷量（棒・左軸）と平均体重（折れ線・右軸） */
export default function BodyVolumeCard({ weeklyStats }: Props) {
  const hasBodyWeight = weeklyStats.some((w) => w.bodyWeight !== null);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle><Icon name="scale" />体重と負荷量</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasBodyWeight && (
          <div className="small-muted" style={{ marginBottom: '0.5rem' }}>
            この期間の体重の記録がありません。ホーム画面で体重を記録すると折れ線が表示されます。
          </div>
        )}
        <ChartContainer config={CHART_CONFIG} className="aspect-auto h-[240px] w-full">
          <ComposedChart data={weeklyStats} margin={{ top: 8, right: 0, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
            <YAxis yAxisId="volume" tickLine={false} axisLine={false} width={44} />
            <YAxis
              yAxisId="bodyWeight"
              orientation="right"
              domain={['dataMin - 1', 'dataMax + 1']}
              tickLine={false}
              axisLine={false}
              width={36}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar yAxisId="volume" dataKey="volume" fill="var(--color-volume)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            {/* 体重の記録がない週は線を途切れさせず、前後の週をつなぐ */}
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
          直近12週。棒が週の負荷量（左の目盛り）、線が週の平均体重（右の目盛り）です。
        </div>
      </CardContent>
    </Card>
  );
}
