import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  dates: string[];
  selectedDate: string;
  onDateChange: (value: string) => void;
}

// shadcn Select は空文字を「未選択」として扱うため、「すべて」の選択肢には専用の値を割り当てる
const ALL_SENTINEL = '__all__';

/** 記録一覧を日付で絞り込むフィルター（未選択時はすべての日付が対象） */
export default function RecordDateFilter({ dates, selectedDate, onDateChange }: Props) {
  return (
    <div className="element-container" style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
      <label>日付</label>
      <Select
        value={selectedDate || ALL_SENTINEL}
        onValueChange={(value) => onDateChange(!value || value === ALL_SENTINEL ? '' : value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue>{(value: string) => (value === ALL_SENTINEL ? 'ALL' : value)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_SENTINEL}>ALL</SelectItem>
          {dates.map((d) => (
            <SelectItem key={d} value={d}>{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}