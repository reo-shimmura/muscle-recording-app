import type { TrainingRecord } from '../../types';

interface Props {
  record: TrainingRecord;
  onDeleteRequest: (id: number) => void;
}

/** 記録1件を表示し削除ボタンを提供するカード */
export default function RecordCard({ record, onDeleteRequest }: Props) {
  return (
    <div className="record-item">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div className="record-item-title">{record.exercise}</div>
          <div className="record-item-meta">
            {record.date} • {record.weight}kg × {record.reps}回 × {record.sets}セット
          </div>
          {record.memo && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>{record.memo}</div>
          )}
        </div>
        <button
          className="btn-danger"
          style={{ marginLeft: '1rem', fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
          onClick={() => onDeleteRequest(record.id || 0)}
        >
          削除
        </button>
      </div>
    </div>
  );
}
