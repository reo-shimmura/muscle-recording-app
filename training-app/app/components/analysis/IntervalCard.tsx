'use client'

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { bucketIntervals, calcIntervals, summarizeIntervals } from '../../lib/analysis/intervals';
import type { TrainingRecord } from '../../types';

interface Props {
  records: TrainingRecord[];
}

const CHART_CONFIG: ChartConfig = {
  count: { label: '回数', color: '#6366f1' },
};

/** 3. 記録の間隔の分布：前回から何日空けて記録しているかの回数を棒グラフで見せる */
export default function IntervalCard({ records }: Props) {
  const intervals = useMemo(() => calcIntervals(records), [records]);
  const buckets = useMemo(() => bucketIntervals(intervals), [intervals]);
  const { average, median } = summarizeIntervals(intervals);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>⏱️ 記録の間隔</CardTitle>
      </CardHeader>
      <CardContent>
        {intervals.length === 0 ? (
          <div className="small-muted">2日以上記録すると、間隔の分布が表示されます。</div>
        ) : (
          <>
            <div style={{ marginBottom: '0.5rem' }}>
              平均 <b>{average}日</b>
              <span className="small-muted">{'　'}中央値 {median}日{'　'}（{intervals.length}回分）</span>
            </div>
            <ChartContainer config={CHART_CONFIG} className="aspect-auto h-[200px] w-full">
              <BarChart data={buckets} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} interval={0} />
                <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ChartContainer>
            <div className="small-muted" style={{ fontSize: '0.75rem' }}>
              前回の記録から次の記録までの日数です。左に寄っているほど、こまめに続けています。
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
