import WorkoutSetCard from './WorkoutSetCard';

interface SetRow {
  weight: number;
  reps: number;
}

interface Props {
  sets: SetRow[];
  onSetChange: (index: number, field: 'weight' | 'reps', value: number) => void;
  onSetDelete: (index: number) => void;
  onSetAdd: () => void;
}

/** セット一覧（複数行）と「セットを追加」ボタン */
export default function WorkoutSetList({ sets, onSetChange, onSetDelete, onSetAdd }: Props) {
  return (
    <div className="element-container">
      <label>セット</label>
      {sets.map((s, idx) => (
        <WorkoutSetCard
          key={idx}
          index={idx}
          setRow={s}
          showDelete={sets.length > 1}
          onChange={onSetChange}
          onDelete={onSetDelete}
        />
      ))}
      <button type="button" onClick={onSetAdd} style={{ marginTop: '0.25rem' }}>
        ＋ セットを追加
      </button>
    </div>
  );
}
