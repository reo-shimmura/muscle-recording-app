import RecordCard from './RecordCard';
import type { TrainingRecord } from '../../types';

interface Props {
  records: TrainingRecord[];
  onDeleteRequest: (id: number) => void;
}

/** 記録詳細タブ：全トレーニング記録の一覧表示と削除起点 */
export default function DetailsTab({ records, onDeleteRequest }: Props) {
  return (
    <div>
      <h3>📊 記録一覧</h3>
      {records.length === 0 ? (
        <div className="alert alert-info">
          まだ記録がありません。「記録追加」タブで追加してください。
        </div>
      ) : (
        <div>
          <p className="small-muted">{records.length} 件の記録</p>
          {records.map((r) => (
            <RecordCard key={r.id} record={r} onDeleteRequest={onDeleteRequest} />
          ))}
        </div>
      )}
    </div>
  );
}
