import { Button } from '@/components/ui/button';
import type { TrainingRecord } from '../../types';

interface Props {
  records: TrainingRecord[];
  currentMonth: number;
  currentYear: number;
  selectedDate: string | null;
  onMonthChange: (month: number, year: number) => void;
  onDateSelect: (date: string) => void;
}

const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

// 実施種目数に応じたセル配色（いずれも濃くなりすぎないよう透明度を抑えている）
const RECORD_COLOR_TIERS = {
  low: { base: 'rgba(59, 130, 246, 0.28)', hover: 'rgba(59, 130, 246, 0.4)', selected: 'rgba(59, 130, 246, 0.5)' }, // 1種目：青
  mid: { base: 'rgba(34, 197, 94, 0.26)', hover: 'rgba(34, 197, 94, 0.38)', selected: 'rgba(34, 197, 94, 0.48)' }, // 2〜4種目：緑
  high: { base: 'rgba(239, 68, 68, 0.28)', hover: 'rgba(239, 68, 68, 0.4)', selected: 'rgba(239, 68, 68, 0.5)' }, // 5種目以上：赤
} as const;

function getRecordColorTier(count: number) {
  if (count <= 0) return null;
  if (count === 1) return RECORD_COLOR_TIERS.low;
  if (count >= 5) return RECORD_COLOR_TIERS.high;
  return RECORD_COLOR_TIERS.mid;
}

export default function CalendarGrid({
  records,
  currentMonth,
  currentYear,
  selectedDate,
  onMonthChange,
  onDateSelect,
}: Props) {
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const recordCountByDate = new Map<string, number>();
  for (const r of records) {
    recordCountByDate.set(r.date, (recordCountByDate.get(r.date) ?? 0) + 1);
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      onMonthChange(11, currentYear - 1);
    } else {
      onMonthChange(currentMonth - 1, currentYear);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      onMonthChange(0, currentYear + 1);
    } else {
      onMonthChange(currentMonth + 1, currentYear);
    }
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="element-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Button type="button" variant="outline" size="sm" onClick={handlePrevMonth}>← 前月</Button>
        <h4 style={{ margin: 0 }}>{currentYear}年 {MONTH_NAMES[currentMonth]}</h4>
        <Button type="button" variant="outline" size="sm" onClick={handleNextMonth}>翌月 →</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              padding: '0.5rem',
              backgroundColor: 'var(--border-color)',
              borderRadius: '4px',
              fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
            }}
          >
            {day}
          </div>
        ))}

        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} style={{ aspectRatio: '1', backgroundColor: 'transparent' }} />;
          }

          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const recordCount = recordCountByDate.get(dateStr) ?? 0;
          const hasRecord = recordCount > 0;
          const colorTier = getRecordColorTier(recordCount);
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onDateSelect(dateStr)}
              style={{
                aspectRatio: '1',
                padding: '0.25rem',
                borderRadius: '8px',
                border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: isSelected ? (colorTier?.selected ?? 'var(--primary)20') : (colorTier?.base ?? 'transparent'),
                color: isSelected ? 'var(--primary)' : 'var(--foreground)',
                fontWeight: isSelected || hasRecord ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'border 0.2s ease, background-color 0.2s ease',
                boxSizing: 'border-box',
                fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.1rem',
                overflow: 'hidden',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = colorTier?.hover ?? 'var(--border-color)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = colorTier?.base ?? 'transparent';
                }
              }}
            >
              <div style={{ lineHeight: '1', height: '1em' }}>{day}</div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--foreground)' }}>
        <LegendItem color={RECORD_COLOR_TIERS.low.base} label="1種目" />
        <LegendItem color={RECORD_COLOR_TIERS.mid.base} label="2〜4種目" />
        <LegendItem color={RECORD_COLOR_TIERS.high.base} label="5種目以上" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
      <span style={{ width: '0.9rem', height: '0.9rem', borderRadius: '4px', backgroundColor: color, border: '1px solid var(--border-color)', display: 'inline-block' }} />
      {label}
    </div>
  );
}
