'use client'

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import OptionButtons from './OptionButtons';
import { calcGrowth } from '../../lib/analysis/growth';
import { toDateStr } from '../../lib/goalsProgress';
import type { TrainingRecord } from '../../types';
import { COLORS } from '../../constants/colors';
import Icon from '../Icon';

interface Props {
  records: TrainingRecord[];
  categoryMap: Record<string, string>;
}

type Span = '30' | '90';

const SPAN_OPTIONS: { key: Span; label: string }[] = [
  { key: '30', label: '直近1か月' },
  { key: '90', label: '直近3か月' },
];

// 棒の長さの上限とする伸び率（%）。これ以上は端まで伸ばす
const BAR_MAX_RATE = 30;

/** 8. 伸び率：直近の推定1RMのベストを、それより前のベストと比べた伸び率の一覧 */
export default function GrowthCard({ records, categoryMap }: Props) {
  const [span, setSpan] = useState<Span>('30');
  const today = toDateStr(new Date());
  const growths = useMemo(
    () => calcGrowth(records, categoryMap, today, Number(span)),
    [records, categoryMap, today, span]
  );

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle><Icon name="chart-up" />伸び率（推定1RM）</CardTitle>
      </CardHeader>
      <CardContent>
        <OptionButtons options={SPAN_OPTIONS} selected={span} onSelect={setSpan} />

        {growths.length === 0 ? (
          <div className="small-muted">比較できる種目がありません（この期間とそれより前の両方に記録が必要です）。</div>
        ) : (
          <>
            {growths.map((g) => {
              const positive = g.rate >= 0;
              const width = Math.min(100, (Math.abs(g.rate) / BAR_MAX_RATE) * 100);
              return (
                <div key={g.exercise} style={{ marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 700 }}>{g.exercise}</span>
                    <span style={{ color: positive ? COLORS.successText : COLORS.warning, fontWeight: 700 }}>
                      {positive ? '+' : ''}{g.rate}%
                    </span>
                  </div>
                  <div style={{ height: 6, background: COLORS.barTrack, borderRadius: 3 }}>
                    <div style={{ width: `${width}%`, height: '100%', borderRadius: 3, background: positive ? COLORS.success : COLORS.warningSoft }} />
                  </div>
                  <div className="small-muted" style={{ fontSize: '0.75rem' }}>
                    {g.past}kg → {g.recent}kg
                  </div>
                </div>
              );
            })}
            <div className="small-muted" style={{ fontSize: '0.75rem' }}>
              この期間の推定1RMのベストを、それより前のベストと比べています。マイナスは停滞・低下のサインです。
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
