/**
 * グラフの横軸を「実際の日付の間隔」で描くための計算をまとめたモジュール。
 * 記録の間が空くほど点と点の距離が長くなるよう、日付を時刻（ミリ秒）の数値に変換して扱う。
 */

export interface TimeAxis {
  /** 軸の範囲 [開始, 終了]（ローカル日付0時のミリ秒） */
  domain: [number, number];
  /** 目盛りの位置（ローカル日付0時のミリ秒） */
  ticks: number[];
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// 目盛り間隔の候補（日数）。期間に応じて目盛りが多くなりすぎない最小の間隔を選ぶ
const TICK_STEP_DAYS = [1, 2, 3, 7, 14, 30, 60, 90, 180, 365];
const MAX_TICKS = 6;

/** YYYY-MM-DD をローカル日付0時のミリ秒に変換する（UTC解釈による日付ずれを避ける） */
export function parseLocalDate(dateStr: string): number {
  const match = DATE_PATTERN.exec(dateStr);
  if (!match) {
    throw new Error(`日付の形式が不正です（YYYY-MM-DD を想定）: ${dateStr}`);
  }
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d)).getTime();
}

/** ミリ秒の日付に日数を足す（月末・年末の繰り上がりは Date に任せる） */
function addDays(time: number, days: number): number {
  const d = new Date(time);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

/** 2つの日付の差を日数で返す（夏時間などで1日が24時間でない場合も丸めて吸収する） */
function diffDays(from: number, to: number): number {
  return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

function chooseTickStep(spanDays: number): number {
  return TICK_STEP_DAYS.find((step) => spanDays / step <= MAX_TICKS) ?? TICK_STEP_DAYS[TICK_STEP_DAYS.length - 1];
}

/**
 * 記録日の一覧から、横軸の範囲と目盛りを作る。
 * - 開始: startDate（表示範囲の初日）があればそれ、なければ最も古い記録日
 * - 終了: 今日（未来日の記録があればその日）。最後の記録から今日までの空きも読み取れるようにする
 * 記録がなければ null を返す。
 * visibleDays: 横スクロールで一部だけ見せる場合に、画面に見える日数を渡す。
 *   目盛りの間隔をその日数を基準に選ぶ（省略時は軸全体の日数を基準にする）。
 */
export function buildTimeAxis(
  dates: string[],
  startDate: string | null,
  today: string,
  visibleDays?: number
): TimeAxis | null {
  if (dates.length === 0) return null;

  const times = dates.map(parseLocalDate);
  let start = startDate !== null ? parseLocalDate(startDate) : Math.min(...times);
  let end = Math.max(parseLocalDate(today), ...times);

  // 範囲が1日だけだと点が軸の端に張り付くため、前後に1日ずつ余白を取る
  if (start === end) {
    start = addDays(start, -1);
    end = addDays(end, 1);
  }

  const spanDays = diffDays(start, end);
  const step = chooseTickStep(visibleDays !== undefined ? Math.min(visibleDays, spanDays) : spanDays);
  const ticks: number[] = [];
  for (let t = start; t <= end; t = addDays(t, step)) {
    ticks.push(t);
  }

  return { domain: [start, end], ticks };
}

/** 軸全体の日数（横スクロール時の幅の計算に使う） */
export function axisSpanDays(axis: TimeAxis): number {
  return diffDays(axis.domain[0], axis.domain[1]);
}

/** 目盛りのラベル（例: 11/5） */
export function formatTickLabel(time: number): string {
  const d = new Date(time);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
