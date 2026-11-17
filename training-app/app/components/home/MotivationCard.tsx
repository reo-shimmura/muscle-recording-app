'use client'

import { useMemo } from 'react';
import { Area, CartesianGrid, ReferenceLine } from 'recharts';
import { type ChartConfig } from '@/components/ui/chart';
import ScrollableTimeChart from '../charts/ScrollableTimeChart';
import {
  calcMotivation,
  CONTINUITY_MIN_SESSIONS,
  CONTINUITY_WINDOW_DAYS,
  WARNING_THRESHOLD,
  type MotivationStatus,
} from '../../lib/motivation';
import { axisSpanDays, buildTimeAxis } from '../../lib/chartTimeAxis';
import { toDateStr } from '../../lib/goalsProgress';
import type { TrainingRecord } from '../../types';
import { COLORS } from '../../constants/colors';
import Icon from '../Icon';

interface Props {
  records: TrainingRecord[];
}

// 画面に一度に見せる日数。これより前の期間は横にスライドして見る
const VISIBLE_DAYS = 60;

const CHART_CONFIG: ChartConfig = {
  level: { label: 'モチベーション', color: COLORS.primary },
};

const STATUS_VIEW: Record<MotivationStatus, { label: string; color: string; message: string }> = {
  good: { label: '好調', color: COLORS.success, message: 'いいペースで続いています！' },
  steady: { label: '維持', color: COLORS.caution, message: 'この調子をキープしましょう。' },
  warning: { label: '要注意', color: COLORS.warning, message: '少し間が空いています。軽めでも1回やってみましょう。' },
};

/**
 * 状態に応じた一言。継続し始めは値が低く「要注意」になりやすいため、
 * 継続中であれば「間が空いている」ではなく励ましの言葉にする。
 */
function statusMessage(base: string, status: MotivationStatus, continuousDays: number | null): string {
  if (status === 'warning' && continuousDays !== null) return '継続中です。続けるほど上がりやすくなります。';
  return base;
}

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
        <h4><Icon name="chart-up" />モチベーション</h4>
        <div className="small-muted">トレーニングを記録すると、継続度の推移がここに表示されます。</div>
      </div>
    );
  }

  const view = STATUS_VIEW[result.status];
  const scrollable = axisSpanDays(axis) > VISIBLE_DAYS;

  return (
    <div className="element-container">
      <h4><Icon name="chart-up" />モチベーション</h4>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '2.25rem', fontWeight: 800, color: view.color, lineHeight: 1 }}>
          {Math.round(result.current)}
        </span>
        <span style={{ fontWeight: 700, color: view.color }}>{view.label}</span>
        <span className="small-muted">
          {result.daysSinceLast === 0 ? '今日記録しました' : `最後の記録から${result.daysSinceLast}日`}
        </span>
      </div>
      <div className="small-muted">{statusMessage(view.message, result.status, result.continuousDays)}</div>
      <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
        {result.continuousDays !== null ? (
          <span style={{ color: COLORS.successText, fontWeight: 700 }}>継続中（{result.continuousDays}日目）</span>
        ) : (
          <span style={{ color: COLORS.warning, fontWeight: 700 }}>継続できていません</span>
        )}
        <span className="small-muted">
          {'　'}直近{CONTINUITY_WINDOW_DAYS}日で{result.recentSessions}回（週{CONTINUITY_MIN_SESSIONS}回で継続）
        </span>
      </div>

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
        <ReferenceLine y={WARNING_THRESHOLD} stroke={COLORS.warning} strokeDasharray="4 4" />
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
        週{CONTINUITY_MIN_SESSIONS}回以上で継続とみなし、続けるほど上がりやすくなります（3か月でほぼ100）。
        記録が途切れると下がり、2週間空くと0に戻ります。高いときほど下がりにくくなります（点線より下は要注意）。
      </div>
    </div>
  );
}
