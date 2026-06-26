interface Props {
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ loading, onConfirm, onCancel }: Props) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>本当に削除しますか？</h3>
        <p className="small-muted">この操作は元に戻せません。</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'var(--border-color)',
              color: 'var(--foreground)',
              border: 'none',
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            キャンセル
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
