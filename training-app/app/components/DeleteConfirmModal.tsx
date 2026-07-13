import { Button } from '@/components/ui/button';

interface Props {
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 削除確認モーダル */
export default function DeleteConfirmModal({ loading, onConfirm, onCancel }: Props) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>本当に削除しますか？</h3>
        <p className="small-muted">この操作は元に戻せません。</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <Button variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            削除
          </Button>
        </div>
      </div>
    </div>
  );
}
