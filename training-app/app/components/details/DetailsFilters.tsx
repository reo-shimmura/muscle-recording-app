interface Props {
  categories: string[];
  exercises: string[];
  selectedCategory: string;
  selectedExercise: string;
  onCategoryChange: (value: string) => void;
  onExerciseChange: (value: string) => void;
}

/** 記録詳細タブのカテゴリ・種目フィルター（未選択時はすべて対象） */
export default function DetailsFilters({
  categories,
  exercises,
  selectedCategory,
  selectedExercise,
  onCategoryChange,
  onExerciseChange,
}: Props) {
  return (
    <div className="row">
      <div className="element-container" style={{ marginBottom: 0 }}>
        <label>カテゴリ</label>
        <select value={selectedCategory} onChange={(e) => onCategoryChange(e.target.value)}>
          <option value="">すべてのカテゴリ</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="element-container" style={{ marginBottom: 0 }}>
        <label>種目</label>
        <select value={selectedExercise} onChange={(e) => onExerciseChange(e.target.value)}>
          <option value="">すべての種目</option>
          {exercises.map((ex) => (
            <option key={ex} value={ex}>{ex}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
