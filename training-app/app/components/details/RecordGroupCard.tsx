'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { TrainingRecord } from '../../types';

interface Props {
  exercise: string;
  records: TrainingRecord[];
  onEditRequest: (record: TrainingRecord) => void;
  onDeleteRequest: (id: number) => void;
}

/** 種目ごとの記録ブロック。行をクリックした記録だけ編集・削除ボタンを表示する */
export default function RecordGroupCard({ exercise, records, onEditRequest, onDeleteRequest }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <Card className="mb-3 border-l-4 border-l-primary">
      <CardContent>
        <div className="record-item-title">{exercise}</div>
        {records.map((r) => {
          const detail = r.duration_minutes != null
            ? `${r.duration_minutes}分`
            : `${r.weight}kg × ${r.reps}回 × ${r.sets}セット`;
          const isExpanded = expandedId === r.id;

          return (
            <div key={r.id} className="mb-2">
              <button
                type="button"
                className="record-item-meta"
                style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                onClick={() => setExpandedId(isExpanded ? null : (r.id ?? null))}
              >
                {detail}
              </button>
              {r.memo && <div style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>{r.memo}</div>}
              {isExpanded && (
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => onEditRequest(r)}>
                    編集
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onDeleteRequest(r.id || 0)}>
                    削除
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
