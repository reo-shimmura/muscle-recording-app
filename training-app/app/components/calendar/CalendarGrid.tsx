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
  const recordDates = new Set(records.map((r) => r.date));

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
          const hasRecord = recordDates.has(dateStr);
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
                backgroundColor: isSelected ? 'var(--primary)20' : hasRecord ? 'var(--primary)10' : 'transparent',
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
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = hasRecord ? 'var(--primary)20' : 'var(--border-color)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = hasRecord ? 'var(--primary)10' : 'transparent';
                }
              }}
            >
              <div style={{ lineHeight: '1', height: '1em' }}>{day}</div>
              {hasRecord && <div style={{ fontSize: '0.5em', lineHeight: '1', height: '0.5em', marginTop: '-0.1em' }}>●</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
