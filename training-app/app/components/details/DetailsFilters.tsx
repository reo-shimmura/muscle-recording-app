import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  categories: string[];
  exercises: string[];
  selectedCategory: string;
  selectedExercise: string;
  onCategoryChange: (value: string) => void;
  onExerciseChange: (value: string) => void;
}

// shadcn Select は空文字を「未選択」として扱うため、「すべて」の選択肢には専用の値を割り当てる
const ALL_SENTINEL = '__all__';

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
        <Select
          value={selectedCategory || ALL_SENTINEL}
          onValueChange={(value) => onCategoryChange(!value || value === ALL_SENTINEL ? '' : value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SENTINEL}>すべてのカテゴリ</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="element-container" style={{ marginBottom: 0 }}>
        <label>種目</label>
        <Select
          value={selectedExercise || ALL_SENTINEL}
          onValueChange={(value) => onExerciseChange(!value || value === ALL_SENTINEL ? '' : value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SENTINEL}>すべての種目</SelectItem>
            {exercises.map((ex) => (
              <SelectItem key={ex} value={ex}>{ex}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
