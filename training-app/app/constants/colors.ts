/**
 * アプリ全体で使う色の定義（赤ベースのテーマ）。
 * 画面ごとに色を直接書かず、ここから参照して一括で調整できるようにする。
 * テーマ（ボタン・ナビなど）の色は globals.css の --primary 系の変数と揃えている。
 */
export const COLORS = {
  /** テーマ・グラフの主色 */
  primary: '#dc2626',
  /** 主色の明るめ（同じグラフ内で主色と区別したい系列） */
  primarySoft: '#f43f5e',
  /** 主色の深め（同上） */
  primaryDeep: '#9f1239',
  /** 主色の淡い色（棒グラフの背景的な系列など） */
  primaryLight: '#fca5a5',

  /** 警告（要注意・未実施・低下など）。主色の赤と区別するためオレンジにする */
  warning: '#ea580c',
  warningSoft: '#f97316',
  warningBorder: '#fdba74',

  /** 注意（維持・最近の更新の印など） */
  caution: '#f59e0b',
  cautionText: '#b45309',

  /** 良好（達成・好調・伸びなど） */
  success: '#10b981',
  successText: '#059669',

  /** 体重 */
  bodyWeight: '#8b5cf6',
  /** 赤と対比させたい分類（引く種目など）にだけ使う青 */
  contrast: '#3b82f6',

  /** 進捗リングの下地など */
  track: '#e5e7eb',
  /** 横棒の下地 */
  barTrack: 'rgba(148, 163, 184, 0.2)',
} as const;

/** 主色（#dc2626）を指定の不透明度で返す（ヒートマップ・カレンダーの濃淡用） */
export function primaryAlpha(alpha: number): string {
  return `rgba(220, 38, 38, ${alpha})`;
}

/** 警告色（#ea580c）を指定の不透明度で返す（警告の背景用） */
export function warningAlpha(alpha: number): string {
  return `rgba(234, 88, 12, ${alpha})`;
}
