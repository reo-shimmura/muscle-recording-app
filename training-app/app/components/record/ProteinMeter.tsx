import { buildProteinMeter } from '../../lib/protein';
import { COLORS, primaryAlpha } from '../../constants/colors';

interface Props {
  /** その日にすでに飲んだ量（g） */
  consumed: number;
  /** 今回記録しようとしている量（g） */
  adding: number;
  /** その日の目安（g） */
  target: number;
}

const BAR_HEIGHT = 20;

/**
 * シングル・メーター：1本の帯に「すでに飲んだ量（濃い赤）」「今回の量（淡い赤）」「1日の目安（線）」を重ねる。
 * 合計が目安を超えたときは、超えた分も帯に収まるよう右端を合計に合わせる。
 */
/** メーターの下に出す一言。まだ保存していない「今回の量」を含むかどうかが分かるようにする */
function statusMessage(consumed: number, target: number, remaining: number): string {
  if (consumed >= target) return '目安を達成しています！';
  if (remaining === 0) return '記録すると目安を達成します！';
  return `記録後、目安まであと ${remaining}g`;
}

export default function ProteinMeter({ consumed, adding, target }: Props) {
  const meter = buildProteinMeter(consumed, adding, target);
  const reached = meter.remaining === 0;

  return (
    <div>
      <div
        role="meter"
        aria-label="今日のプロテイン摂取量"
        aria-valuemin={0}
        aria-valuemax={meter.max}
        aria-valuenow={meter.total}
        style={{ position: 'relative', height: BAR_HEIGHT, borderRadius: 6, background: COLORS.barTrack, overflow: 'visible' }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${meter.consumedPercent}%`,
            background: COLORS.primary,
            borderRadius: '6px 0 0 6px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${meter.consumedPercent}%`,
            top: 0,
            bottom: 0,
            width: `${meter.addingPercent}%`,
            background: primaryAlpha(0.35),
            transition: 'width 0.15s ease',
          }}
        />
        {/* 1日の目安の線 */}
        <div
          style={{
            position: 'absolute',
            left: `calc(${meter.targetPercent}% - 1px)`,
            top: -4,
            bottom: -4,
            width: 2,
            background: 'var(--foreground)',
          }}
        />
      </div>

      <div style={{ position: 'relative', height: '1.2rem', fontSize: '0.75rem' }}>
        <span className="small-muted" style={{ position: 'absolute', left: 0 }}>0g</span>
        <span
          style={{
            position: 'absolute',
            left: `${meter.targetPercent}%`,
            transform: meter.targetPercent > 85 ? 'translateX(-100%)' : 'translateX(-50%)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          目安 {target}g
        </span>
      </div>

      <div style={{ marginTop: '0.25rem' }}>
        合計 <b>{meter.total}g</b>
        <span className="small-muted">（飲んだ分 {consumed}g ＋ 今回 {adding}g）</span>
        <div style={{ color: reached ? COLORS.successText : undefined, fontWeight: reached ? 700 : 400 }}>
          {statusMessage(consumed, target, meter.remaining)}
        </div>
      </div>
    </div>
  );
}
