import { Button } from '@/components/ui/button';

interface Props<K extends string> {
  options: { key: K; label: string }[];
  selected: K;
  onSelect: (key: K) => void;
}

/** 分析カードで使う切り替えボタンの列（選択中のみ塗りつぶし） */
export default function OptionButtons<K extends string>({ options, selected, onSelect }: Props<K>) {
  return (
    <div className="row" style={{ marginBottom: '0.5rem', flexWrap: 'wrap' }}>
      {options.map(({ key, label }) => (
        <Button
          key={key}
          type="button"
          size="sm"
          variant={selected === key ? 'default' : 'outline'}
          onClick={() => onSelect(key)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
