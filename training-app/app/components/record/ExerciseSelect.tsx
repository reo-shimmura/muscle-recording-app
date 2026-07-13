import { DEFAULT_EXERCISES } from '../../constants/exercises';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CustomExercise } from '../../types';

interface Props {
  value: string;
  newValue: string;
  newCategory: string;
  customExercises: string[];
  customExercisesWithCategory: CustomExercise[];
  onSelectChange: (value: string) => void;
  onNewValueChange: (value: string) => void;
  onNewCategoryChange: (category: string) => void;
}

/** 既存種目のドロップダウン＋新規種目の自由入力欄（カテゴリ選択付き） */
export default function ExerciseSelect({
  value,
  newValue,
  newCategory,
  customExercises,
  customExercisesWithCategory,
  onSelectChange,
  onNewValueChange,
  onNewCategoryChange,
}: Props) {
  // デフォルトカテゴリ + カテゴリ付きカスタム種目を統合して表示
  const mergedByCategory: Record<string, string[]> = {};
  for (const [cat, exs] of Object.entries(DEFAULT_EXERCISES)) {
    mergedByCategory[cat] = [...exs];
  }
  for (const ex of customExercisesWithCategory) {
    if (mergedByCategory[ex.category]) {
      if (!mergedByCategory[ex.category].includes(ex.name)) {
        mergedByCategory[ex.category] = [...mergedByCategory[ex.category], ex.name];
      }
    } else {
      mergedByCategory[ex.category] = [ex.name];
    }
  }

  // カテゴリ候補（デフォルト + カスタムカテゴリ）
  const defaultCategoryKeys = Object.keys(DEFAULT_EXERCISES);
  const customCategoryKeys = Array.from(
    new Set(customExercisesWithCategory.map((e) => e.category))
  ).filter((c) => !defaultCategoryKeys.includes(c));
  const allCategoryKeys = [...defaultCategoryKeys, ...customCategoryKeys];

  return (
    <div className="element-container">
      <label>種目</label>
      <Select value={value} onValueChange={(v) => onSelectChange(v ?? '')}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="-- 種目を選択 --" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(mergedByCategory).map(([category, exercises]) => (
            <SelectGroup key={category}>
              <SelectLabel>{category}</SelectLabel>
              {exercises.map((ex) => (
                <SelectItem key={ex} value={ex}>{ex}</SelectItem>
              ))}
            </SelectGroup>
          ))}
          {customExercises.length > 0 && (
            <SelectGroup>
              <SelectLabel>カスタム</SelectLabel>
              {customExercises.map((ex) => (
                <SelectItem key={ex} value={ex}>{ex}</SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>

      <input
        type="text"
        placeholder="または新規種目を入力（例: インクラインベンチプレス）"
        value={newValue}
        onChange={(e) => onNewValueChange(e.target.value)}
        style={{ marginTop: '0.5rem' }}
      />

      {/* 新規種目を入力中のときのみカテゴリ入力欄を表示 */}
      {newValue.trim() && (
        <>
          <datalist id="category-suggestions">
            {allCategoryKeys.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
          <input
            type="text"
            list="category-suggestions"
            placeholder="カテゴリを入力または選択（任意：胸・背中・脚 など）"
            value={newCategory}
            onChange={(e) => onNewCategoryChange(e.target.value)}
            style={{ marginTop: '0.5rem' }}
          />
        </>
      )}

      <div className="small-muted">新規入力がある場合、選択値より優先して保存されます。</div>
    </div>
  );
}
