'use client'

import { useMemo } from 'react';
import { calcLastTrainedByCategory } from '../../lib/analysis/lastTrained';
import { toDateStr } from '../../lib/goalsProgress';
import { DEFAULT_EXERCISES } from '../../constants/exercises';
import type { TrainingRecord } from '../../types';

interface Props {
  records: TrainingRecord[];
  categoryMap: Record<string, string>;
}

// この日数以上空いた部位を強調する
const ALERT_DAYS = 7;

const CATEGORIES = Object.keys(DEFAULT_EXERCISES);

function daysLabel(daysAgo: number | null): string {
  if (daysAgo === null) return '未実施';
  if (daysAgo === 0) return '今日';
  return `${daysAgo}日前`;
}

/** ホーム画面：部位ごとに最後に鍛えた日を表示し、しばらくやっていない部位を知らせる */
export default function LastTrainedCard({ records, categoryMap }: Props) {
  const today = toDateStr(new Date());
  const items = useMemo(
    () => calcLastTrainedByCategory(records, categoryMap, CATEGORIES, today),
    [records, categoryMap, today]
  );

  return (
    <div className="element-container">
      <h4>🧭 部位ごとの最終実施日</h4>
      <div className="small-muted" style={{ marginBottom: '0.5rem' }}>
        空いている順に表示しています（{ALERT_DAYS}日以上は赤）。
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: '0.5rem' }}>
        {items.map(({ category, daysAgo }) => {
          const alert = daysAgo === null || daysAgo >= ALERT_DAYS;
          return (
            <div
              key={category}
              style={{
                border: `1px solid ${alert ? '#fca5a5' : 'var(--border, #e5e7eb)'}`,
                background: alert ? 'rgba(239, 68, 68, 0.08)' : undefined,
                borderRadius: 8,
                padding: '0.5rem',
                textAlign: 'center',
              }}
            >
              <div style={{ fontWeight: 700 }}>{category}</div>
              <div style={{ color: alert ? '#dc2626' : undefined, fontSize: '0.875rem' }}>{daysLabel(daysAgo)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
