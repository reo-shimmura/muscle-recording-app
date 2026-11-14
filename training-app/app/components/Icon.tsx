import type { CSSProperties } from 'react';

/**
 * シルエットのアイコン。
 * 素材: シルエットイラスト（https://www.silhouette-illust.com/ 、運営: サニーサンデー）
 *   - 商用・個人とも無料、クレジット表記不要、加工自由。Webサービス内のアイコンとしての利用は規約上の使用例。
 *   - ロゴ・商品への使用、素材の再配布は禁止（https://www.silhouette-illust.com/policy）。
 * 白黒の透過PNGを public/icons/ に128pxで置き、CSSのマスクで任意の色（既定はテーマの赤）に塗る。
 */
const ICON_FILES = {
  dumbbell: 'dumbbell', // ダンベル（素材16765）
  home: 'home', // 家（3551）
  pencil: 'pencil', // 鉛筆（14521）
  target: 'target', // 的（6487）
  calendar: 'calendar', // カレンダー（48956）
  'calendar-training': 'calendar-training', // カレンダー＋ダンベル（49987）
  'chart-up': 'chart-up', // 上昇グラフ（43147）
  'training-log': 'training-log', // トレーニング記録（49988）
  trophy: 'trophy', // トロフィー（2246）
  medal: 'medal', // メダル（10550）
  scale: 'scale', // 体重計（8073）
  balance: 'balance', // 天秤（49412）
  cycle: 'cycle', // 循環矢印（7458）
  muscle: 'muscle', // 力こぶ（28491）
  'daily-calendar': 'daily-calendar', // 日めくりカレンダー（24071）
  compass: 'compass', // 方位磁石（17273）
  stopwatch: 'stopwatch', // ストップウォッチ（19764）
  flame: 'flame', // 炎（3622）
  rocket: 'rocket', // ロケット（10779）
  star: 'star', // 星（41410）
  lifter: 'lifter', // ダンベルを持つ人（29691）
} as const;

export type IconName = keyof typeof ICON_FILES;

interface Props {
  name: IconName;
  /** 一辺の大きさ（既定は文字の大きさに合わせて 1.15em） */
  size?: string | number;
  /** 塗る色（既定はテーマの赤。親の文字色に合わせるなら 'currentColor'） */
  color?: string;
  /** 前後の文字との間隔（既定は右に 0.35em） */
  style?: CSSProperties;
}

/** 見出しやボタンの文字の前に置くアイコン（装飾なので読み上げ対象から外す） */
export default function Icon({ name, size = '1.15em', color = 'var(--primary)', style }: Props) {
  const url = `url(/icons/${ICON_FILES[name]}.png)`;
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        flexShrink: 0,
        width: size,
        height: size,
        marginRight: '0.35em',
        verticalAlign: '-0.18em',
        backgroundColor: color,
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        ...style,
      }}
    />
  );
}
