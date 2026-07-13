import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { TrainingRecord } from '../../types';

interface Props {
  record: TrainingRecord;
  onDeleteRequest: (id: number) => void;
}

/** 記録1件を表示し削除ボタンを提供するカード */
export default function RecordCard({ record, onDeleteRequest }: Props) {
  return (
    <Card className="mb-3 border-l-4 border-l-primary">
      <CardContent className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="record-item-title">{record.exercise}</div>
          <div className="record-item-meta">
            {record.date} • {record.duration_minutes != null
              ? `${record.duration_minutes}分`
              : `${record.weight}kg × ${record.reps}回 × ${record.sets}セット`}
          </div>
          {record.memo && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>{record.memo}</div>
          )}
        </div>
        <Button variant="destructive" size="sm" onClick={() => onDeleteRequest(record.id || 0)}>
          削除
        </Button>
      </CardContent>
    </Card>
  );
}
