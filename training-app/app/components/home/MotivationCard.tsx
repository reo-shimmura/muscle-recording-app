'use client'

import { useMemo } from 'react';
import { Area, CartesianGrid, ReferenceLine } from 'recharts';
import { type ChartConfig } from '@/components/ui/chart';
import ScrollableTimeChart from '../charts/ScrollableTimeChart';
import { calcMotivation, WARNING_THRESHOLD, type MotivationStatus } from '../../lib/motivation';
import { axisSpanDays, buildTimeAxis } from '../../lib/chartTimeAxis';
import { toDateStr } from '../../lib/goalsProgress';
import type { TrainingRecord } from '../../types';

interface Props {
  records: TrainingRecord[];
}

// 画面に一度に見せる日数。これより前の期間は横にスライドして見る
const VISIBLE_DAYS = 60;

const CHART_CONFIG: ChartConfig = {
  level: { label: 'モチベーション', color: '#6366f1' },
};

const STATUS_VIEW: Record<MotivationStatus, { label: string; color: string; message: string }> = {
  good: { label: '好調', color: '#10b981', message: 'いいペースで続いています！' },
  steady: { label: '維持', color: '#f59e0b', message: 'この調子をキープしましょう。' },
  warning: { label: '要注意', color: '#ef4444', message: '少し間が空いています。軽めでも1回やってみましょう。' },
};

/** ホーム画面：忘却曲線のような形で、トレーニングの継続度（モチベーション）を表示する */
export default function MotivationCard({ records }: Props) {
  const today = toDateStr(new Date());
  const result = useMemo(() => calcMotivation(records, today), [records, today]);

  // 全期間を描き、見えている日数を基準に目盛りを置く
  const axis = useMemo(
    () => (result ? buildTimeAxis(result.points.map((p) => p.date), null, today, VISIBLE_DAYS) : null),
    [result, today]
  );

  if (!result || !axis) {
    return (
      <div className="element-container">
        <h4>📈 モチベーション</h4>
        <div className="small-muted">トレーニングを記録すると、継続度の推移がここに表示されます。</div>
      </div>
    );
  }

  const view = STATUS_VIEW[result.status];
  const scrollable = axisSpanDays(axis) > VISIBLE_DAYS;

  return (
    <div className="element-container">
      <h4>📈 モチベーション</h4>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '2.25rem', fontWeight: 800, color: view.color, lineHeight: 1 }}>
          {Math.round(result.current)}
        </span>
        <span style={{ fontWeight: 700, color: view.color }}>{view.label}</span>
        <span className="small-muted">
          {result.daysSinceLast === 0 ? '今日記録しました' : `最後の記録から${result.daysSinceLast}日`}
        </span>
      </div>
      <div className="small-muted" style={{ marginBottom: '0.5rem' }}>{view.message}</div>

      <ScrollableTimeChart
        config={CHART_CONFIG}
        data={result.points}
        axis={axis}
        visibleDays={VISIBLE_DAYS}
        seriesKey="level"
        yDomain={[0, 100]}
        yTicks={[0, 40, 70, 100]}
        heightClass="h-[200px]"
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <ReferenceLine y={WARNING_THRESHOLD} stroke="#ef4444" strokeDasharray="4 4" />
        {/* monotone 補間で滑らかにつなぐ（値の行き過ぎが起きず、100超えや不自然な凹みが出ない） */}
        <Area
          type="monotone"
          dataKey="level"
          name="モチベーション"
          stroke="var(--color-level)"
          fill="var(--color-level)"
          fillOpacity={0.15}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </ScrollableTimeChart>

      <div className="small-muted" style={{ fontSize: '0.75rem' }}>
        {scrollable && '← 横にスライドすると過去の推移を見られます。'}
        記録した日に上がり、間が空くと下がります。続けるほど下がりにくくなります（点線より下は要注意）。
      </div>
    </div>
  );
}
