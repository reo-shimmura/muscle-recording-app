interface SetRow {
  weight: number;
  reps: number;
}

interface Props {
  index: number;
  setRow: SetRow;
  showDelete: boolean;
  onChange: (index: number, field: 'weight' | 'reps', value: number) => void;
  onDelete: (index: number) => void;
}

/** セット1行分の入力（重量・回数・削除ボタン） */
export default function WorkoutSetCard({ index, setRow, showDelete, onChange, onDelete }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-end',
        marginBottom: '0.75rem',
        padding: '0.75rem',
        backgroundColor: 'var(--background-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
      }}
    >
      <span style={{ minWidth: '4rem', fontWeight: 'bold', paddingBottom: '0.4rem' }}>
        {index + 1}セット目
      </span>
      <div style={{ flex: 1 }}>
        <label style={{ fontSize: '0.8rem' }}>重量 (kg)</label>
        <input
          type="number"
          step="0.5"
          min="0"
          value={setRow.weight}
          onChange={(e) => onChange(index, 'weight', Number(e.target.value))}
          required
        />
      </div>
      <div style={{ flex: 1 }}>
        <label style={{ fontSize: '0.8rem' }}>回数</label>
        <input
          type="number"
          min="1"
          value={setRow.reps}
          onChange={(e) => onChange(index, 'reps', Number(e.target.value))}
          required
        />
      </div>
      {showDelete && (
        <button
          type="button"
          className="btn-danger"
          style={{ flexShrink: 0 }}
          onClick={() => onDelete(index)}
        >
          削除
        </button>
      )}
    </div>
  );
}
