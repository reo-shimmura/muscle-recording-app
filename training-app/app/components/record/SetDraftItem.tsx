import type { WorkoutSetItem } from '../../types';

interface Props {
  item: WorkoutSetItem;
  index: number;
  onChange: (index: number, field: keyof WorkoutSetItem, value: string | number) => void;
}

/** セット一括記録時の1種目行（種目名・重量・回数・セット数の編集） */
export default function SetDraftItem({ item, index, onChange }: Props) {
  return (
    <div
      style={{
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: 'var(--background-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
      }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <label>種目 {index + 1}</label>
        <input
          type="text"
          value={item.exercise}
          onChange={(e) => onChange(index, 'exercise', e.target.value)}
          required
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div>
          <label>重量 (kg)</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={item.weight}
            onChange={(e) => onChange(index, 'weight', Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label>回数</label>
          <input
            type="number"
            min="1"
            value={item.reps}
            onChange={(e) => onChange(index, 'reps', Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label>セット数</label>
          <input
            type="number"
            min="1"
            value={item.sets}
            onChange={(e) => onChange(index, 'sets', Number(e.target.value))}
            required
          />
        </div>
      </div>
    </div>
  );
}
