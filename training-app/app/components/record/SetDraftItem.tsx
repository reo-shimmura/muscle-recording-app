import { NumberInput } from '@/components/ui/number-input';
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
          <NumberInput
            min="0"
            step="0.5"
            value={item.weight}
            onChange={(value) => onChange(index, 'weight', value)}
            required
          />
        </div>
        <div>
          <label>回数</label>
          <NumberInput
            min="1"
            value={item.reps}
            onChange={(value) => onChange(index, 'reps', value)}
            required
          />
        </div>
        <div>
          <label>セット数</label>
          <NumberInput
            min="1"
            value={item.sets}
            onChange={(value) => onChange(index, 'sets', value)}
            required
          />
        </div>
      </div>
    </div>
  );
}
