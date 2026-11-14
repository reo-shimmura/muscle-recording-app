import { describe, expect, it } from 'vitest';
import { axisSpanDays, buildTimeAxis, formatTickLabel, parseLocalDate } from './chartTimeAxis';

const DAY = 24 * 60 * 60 * 1000;

describe('parseLocalDate', () => {
  it('ローカル日付の0時として解釈する', () => {
    const d = new Date(parseLocalDate('2026-11-05'));
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours()]).toEqual([2026, 11, 5, 0]);
  });

  it('形式が不正ならエラーにする', () => {
    expect(() => parseLocalDate('2026/11/05')).toThrow();
    expect(() => parseLocalDate('')).toThrow();
  });
});

describe('buildTimeAxis', () => {
  it('記録がなければ null を返す', () => {
    expect(buildTimeAxis([], null, '2026-11-14')).toBeNull();
  });

  it('記録の間隔が日数に比例した距離になる', () => {
    const axis = buildTimeAxis(['2026-11-01', '2026-11-02', '2026-11-12'], null, '2026-11-12');
    const [a, b, c] = ['2026-11-01', '2026-11-02', '2026-11-12'].map(parseLocalDate);
    // 1日差と10日差で、距離が10倍になる
    expect((c - b) / (b - a)).toBe(10);
    expect(axis?.domain).toEqual([a, c]);
  });

  it('全期間では最古の記録日から今日までを範囲にする', () => {
    const axis = buildTimeAxis(['2026-11-05', '2026-11-03'], null, '2026-11-14');
    expect(axis?.domain).toEqual([parseLocalDate('2026-11-03'), parseLocalDate('2026-11-14')]);
  });

  it('表示範囲の開始日があれば、記録がない日も含めてそこから始める', () => {
    const axis = buildTimeAxis(['2026-11-12'], '2026-11-08', '2026-11-14');
    expect(axis?.domain).toEqual([parseLocalDate('2026-11-08'), parseLocalDate('2026-11-14')]);
  });

  it('範囲が1日だけなら前後に1日ずつ余白を取る', () => {
    const axis = buildTimeAxis(['2026-11-14'], null, '2026-11-14');
    const day = parseLocalDate('2026-11-14');
    expect(axis?.domain).toEqual([day - DAY, day + DAY]);
  });

  it('目盛りは6本以内に収め、範囲の開始日から始まる', () => {
    const axis = buildTimeAxis(['2026-08-16'], null, '2026-11-14');
    expect(axis?.ticks.length).toBeLessThanOrEqual(6);
    expect(axis?.ticks[0]).toBe(parseLocalDate('2026-08-16'));
    expect(axis?.ticks.every((t) => t <= parseLocalDate('2026-11-14'))).toBe(true);
  });

  it('見える日数を渡すと、その日数を基準に目盛り間隔を選ぶ（全体では6本を超えてよい）', () => {
    // 約120日の軸を、60日ずつ見せる → 14日間隔
    const axis = buildTimeAxis(['2026-07-17'], null, '2026-11-14', 60);
    const [first, second] = axis!.ticks;
    expect(axisSpanDays(axis!)).toBe(120);
    expect(Math.round((second - first) / DAY)).toBe(14);
    expect(axis!.ticks.length).toBeGreaterThan(6);
  });

  it('期間が短ければ1日ごとの目盛りにする', () => {
    const axis = buildTimeAxis(['2026-11-10'], '2026-11-10', '2026-11-14');
    expect(axis?.ticks.map(formatTickLabel)).toEqual(['11/10', '11/11', '11/12', '11/13', '11/14']);
  });
});

describe('formatTickLabel', () => {
  it('月/日 の形式にする', () => {
    expect(formatTickLabel(parseLocalDate('2026-01-05'))).toBe('1/5');
  });
});
