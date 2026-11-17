import { COLORS } from '../../constants/colors';

export interface GoalProgressItem {
  key: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  percent: number;
}

interface Props {
  item: GoalProgressItem;
}

/** 目標1件分の横棒（ラベル・実績/目標・達成率・バー）。達成したら緑にして ✓ を付ける */
export default function GoalProgressBar({ item }: Props) {
  const achieved = item.percent >= 100;
  const color = achieved ? COLORS.success : COLORS.primary;

  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', fontSize: '0.875rem' }}>
        <span style={{ fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.label}
        </span>
        <span className="small-muted" style={{ whiteSpace: 'nowrap' }}>
          {item.current} / {item.target} {item.unit}
        </span>
        <span style={{ fontWeight: 700, color, minWidth: '3.2em', textAlign: 'right', whiteSpace: 'nowrap' }}>
          {achieved ? '✓ ' : ''}{item.percent}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={item.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={item.percent}
        style={{ height: 8, borderRadius: 4, background: COLORS.barTrack, overflow: 'hidden', marginTop: 3 }}
      >
        <div style={{ width: `${Math.min(100, item.percent)}%`, height: '100%', borderRadius: 4, background: color }} />
      </div>
    </div>
  );
}
