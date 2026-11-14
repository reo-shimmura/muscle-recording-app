'use client'

import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import { ComposedChart, Line, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { axisSpanDays, formatTickLabel, type TimeAxis } from '../../lib/chartTimeAxis';

// recharts は縦軸の範囲の型を公開していないため、YAxis の props から取り出す
type YAxisDomain = ComponentProps<typeof YAxis>['domain'];

interface Props<T extends { time: number; date: string }> {
  config: ChartConfig;
  /** 各点に time（日付のミリ秒）と date（YYYY-MM-DD）を持つデータ */
  data: T[];
  axis: TimeAxis;
  /** 1画面に見せる日数。null なら全期間を1画面に収める（スクロールなし） */
  visibleDays: number | null;
  /** 縦軸の範囲を決めるための系列のキー（固定表示の縦軸グラフで、本体と同じ範囲を計算させる） */
  seriesKey: string;
  yDomain?: YAxisDomain;
  yTicks?: number[];
  /** Tailwind の高さクラス（例: h-[200px]） */
  heightClass: string;
  /** 本体のグラフに描く系列や補助線（Line / Area / CartesianGrid / ReferenceLine など） */
  children: ReactNode;
}

const MARGIN = { top: 8, right: 16, left: 0, bottom: 8 };
const X_AXIS_HEIGHT = 30;
const Y_AXIS_WIDTH = 40;

/** 全期間の日数を、1画面に見せる日数で割った分だけ横に広げる（%） */
export function calcScrollWidthPercent(axis: TimeAxis, visibleDays: number | null): number {
  if (visibleDays === null || visibleDays <= 0) return 100;
  return Math.max(100, (axisSpanDays(axis) / visibleDays) * 100);
}

/**
 * 縦軸を左に固定し、時間軸の本体だけを横スクロールできるグラフ。
 * 縦軸だけの細いグラフと本体のグラフを並べ、高さ・余白・横軸の高さを揃えて位置を合わせる。
 */
export default function ScrollableTimeChart<T extends { time: number; date: string }>({
  config,
  data,
  axis,
  visibleDays,
  seriesKey,
  yDomain = [0, 'auto'],
  yTicks,
  heightClass,
  children,
}: Props<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const widthPercent = calcScrollWidthPercent(axis, visibleDays);

  // 表示幅やデータが変わったときは、右端（今日）が見える位置にする
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [widthPercent, data]);

  return (
    <div style={{ display: 'flex' }}>
      {/* 縦軸だけのグラフ：見えない系列を置いて、本体と同じ縦軸の範囲を計算させる */}
      <ChartContainer config={config} className={`aspect-auto ${heightClass}`} style={{ width: Y_AXIS_WIDTH, flexShrink: 0 }}>
        <ComposedChart data={data} margin={{ ...MARGIN, right: 0 }}>
          <XAxis dataKey="time" type="number" tick={false} axisLine={false} tickLine={false} height={X_AXIS_HEIGHT} />
          <YAxis domain={yDomain} ticks={yTicks} tickLine={false} axisLine={false} width={Y_AXIS_WIDTH} />
          <Line dataKey={seriesKey} stroke="transparent" dot={false} activeDot={false} isAnimationActive={false} />
        </ComposedChart>
      </ChartContainer>

      {/* 本体：全期間の幅で描き、横にスライドして過去を見られるようにする */}
      <div ref={scrollRef} style={{ flex: 1, minWidth: 0, overflowX: 'auto' }}>
        <div style={{ width: `${widthPercent}%` }}>
          <ChartContainer config={config} className={`aspect-auto ${heightClass} w-full`}>
            <ComposedChart data={data} margin={MARGIN}>
              <XAxis
                dataKey="time"
                type="number"
                scale="time"
                domain={axis.domain}
                ticks={axis.ticks}
                tickFormatter={formatTickLabel}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                height={X_AXIS_HEIGHT}
              />
              <YAxis domain={yDomain} ticks={yTicks} hide />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    // ラベルは数値の time ではなく記録日を表示する
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
                  />
                }
              />
              {children}
            </ComposedChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
