import { DEFAULT_EXERCISES } from '../../constants/exercises';

interface Props {
  value: string;
  newValue: string;
  customExercises: string[];
  onSelectChange: (value: string) => void;
  onNewValueChange: (value: string) => void;
}

/** 既存種目のドロップダウン＋新規種目の自由入力欄 */
export default function ExerciseSelect({
  value,
  newValue,
  customExercises,
  onSelectChange,
  onNewValueChange,
}: Props) {
  return (
    <div className="element-container">
      <label>種目</label>
      <select value={value} onChange={(e) => onSelectChange(e.target.value)}>
        <option value="">-- 種目を選択 --</option>
        {Object.entries(DEFAULT_EXERCISES).map(([category, exercises]) => (
          <optgroup key={category} label={category}>
            {exercises.map((ex) => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </optgroup>
        ))}
        {customExercises.length > 0 && (
          <optgroup label="カスタム">
            {customExercises.map((ex) => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </optgroup>
        )}
      </select>
      <input
        type="text"
        placeholder="または新規種目を入力（例: デッドリフト）"
        value={newValue}
        onChange={(e) => onNewValueChange(e.target.value)}
        style={{ marginTop: '0.5rem' }}
      />
      <div className="small-muted">新規入力がある場合、選択値より優先して保存されます。</div>
    </div>
  );
}
