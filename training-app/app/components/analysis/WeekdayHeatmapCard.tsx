'use client'

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildWeekdayHeatmap, countByWeekday, WEEKDAY_LABELS, type HeatLevel } from '../../lib/analysis/weekdayHeatmap';
import { toDateStr } from '../../lib/goalsProgress';
import type { TrainingRecord } from '../../types';

interface Props {
  records: TrainingRecord[];
}

// 表示する週数（スマホ幅でもマスが小さくなりすぎない程度）
const WEEKS = 16;

// 濃さごとの色（0 は記録なし）
const LEVEL_COLORS: Record<HeatLevel, string> = {
  0: 'rgba(148, 163, 184, 0.18)',
  1: 'rgba(99, 102, 241, 0.3)',
  2: 'rgba(99, 102, 241, 0.5)',
  3: 'rgba(99, 102, 241, 0.75)',
  4: 'rgba(99, 102, 241, 1)',
};

/** 2. 曜日別ヒートマップ：曜日×週のマスを負荷量の濃さで塗り、よくやる曜日・空きがちな曜日を見せる */
export default function WeekdayHeatmapCard({ records }: Props) {
  const today = toDateStr(new Date());
  const grid = useMemo(() => buildWeekdayHeatmap(records, today, WEEKS), [records, today]);
  const weekdayCounts = useMemo(() => countByWeekday(records), [records]);
  const maxCount = Math.max(...weekdayCounts);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>🟩 曜日別ヒートマップ</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `1.25rem repeat(${WEEKS}, 1fr)`,
            gridTemplateRows: 'repeat(7, auto)',
            gridAutoFlow: 'column',
            gap: 3,
          }}
        >
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="small-muted" style={{ fontSize: '0.7rem', lineHeight: 1, alignSelf: 'center' }}>
              {label}
            </div>
          ))}
          {grid.flat().map((cell) => (
            <div
              key={cell.date}
              title={cell.level === 0 ? cell.date : `${cell.date}：負荷量 ${Math.round(cell.volume).toLocaleString()}kg`}
              style={{
                aspectRatio: '1',
                borderRadius: 3,
                background: cell.future ? 'transparent' : LEVEL_COLORS[cell.level],
                outline: cell.date === today ? '2px solid #6366f1' : undefined,
              }}
            />
          ))}
        </div>
        <div className="small-muted" style={{ fontSize: '0.75rem', margin: '0.25rem 0 0.75rem' }}>
          直近{WEEKS}週。右端が今週で、濃いほど負荷量が多い日です。
        </div>

        <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>曜日ごとの実施回数（全期間）</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
          {weekdayCounts.map((count, i) => (
            <div key={WEEKDAY_LABELS[i]}>
              <div className="small-muted" style={{ fontSize: '0.75rem' }}>{WEEKDAY_LABELS[i]}</div>
              <div style={{ fontWeight: count === maxCount && count > 0 ? 800 : 400, color: count === 0 ? '#dc2626' : undefined }}>
                {count}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
