import { describe, expect, it } from 'vitest';
import { calcMotivation, decayLevel, fadeDays, sessionGain, toMotivationStatus } from './motivation';
import { addDaysStr } from './analysis/common';
import type { TrainingRecord } from '../types';

function record(date: string): TrainingRecord {
  return { date, exercise: 'ベンチプレス', weight: 50, reps: 10, sets: 3, duration_minutes: null, memo: '' };
}

// 2026-01-05（月）から週3回（月・水・金）を weeks 週続けた記録
const START = '2026-01-05';
function mondayWednesdayFriday(weeks: number): TrainingRecord[] {
  return Array.from({ length: weeks }, (_, w) => [0, 2, 4].map((d) => record(addDaysStr(START, w * 7 + d)))).flat();
}

/** START から days 日後の時点の値 */
function levelAfter(records: TrainingRecord[], days: number): number {
  return calcMotivation(records, addDaysStr(START, days))!.current;
}

describe('decayLevel（下がり方）', () => {
  it('100 からは14日で0になる', () => {
    expect(decayLevel(100, 14)).toBe(0);
    expect(fadeDays(100)).toBe(14);
  });

  it('最初はゆっくり、日が経つほど急に下がる', () => {
    expect(decayLevel(100, 3)).toBeCloseTo(95.4, 1);
    expect(decayLevel(100, 7)).toBe(75);
    expect(decayLevel(100, 10)).toBeCloseTo(49, 0);
  });

  it('高いときほど下がりにくい（同じ日数でも残る割合が大きい）', () => {
    expect(decayLevel(100, 7) / 100).toBeGreaterThan(decayLevel(50, 7) / 50);
    expect(fadeDays(0)).toBe(7);
  });
});

describe('sessionGain（1回の上がり幅）', () => {
  it('継続していないときは5', () => {
    expect(sessionGain(null)).toBe(5);
  });

  it('継続し始めは5のまま、約1か月を過ぎると増え、3か月近くで8になる', () => {
    expect(sessionGain(0)).toBe(5);
    expect(sessionGain(28)).toBe(5);
    expect(sessionGain(56)).toBeGreaterThan(5);
    expect(sessionGain(84)).toBe(8);
  });
});

describe('calcMotivation', () => {
  it('記録がなければ null', () => {
    expect(calcMotivation([], '2026-11-17')).toBeNull();
  });

  it('0 から1回記録しても5までしか上がらず、1週間ほどで0に戻る', () => {
    const records = [record(START)];
    expect(levelAfter(records, 0)).toBe(5);
    expect(levelAfter(records, 7)).toBeLessThanOrEqual(1);
    expect(levelAfter(records, 8)).toBe(0);
  });

  it('今日より後の日付の記録は含めない', () => {
    expect(levelAfter([record(START), record(addDaysStr(START, 3))], 1)).toBeLessThanOrEqual(5);
    expect(calcMotivation([record(addDaysStr(START, 3))], START)).toBeNull();
  });

  it('週3回を続けると、最初は上がりづらく、3か月でほぼ100になる', () => {
    const records = mondayWednesdayFriday(14);
    const at = (days: number) => levelAfter(records, days);

    expect(at(6)).toBeGreaterThanOrEqual(10); // 1週間
    expect(at(6)).toBeLessThanOrEqual(18);
    expect(at(29)).toBeGreaterThanOrEqual(38); // 1か月
    expect(at(29)).toBeLessThanOrEqual(50);
    expect(at(59)).toBeGreaterThanOrEqual(75); // 2か月
    expect(at(59)).toBeLessThanOrEqual(88);
    expect(at(88)).toBeGreaterThanOrEqual(97); // 3か月
  });

  it('週2回（継続できていない）だと、3か月続けても低いまま', () => {
    const records = Array.from({ length: 14 }, (_, w) => [0, 3].map((d) => record(addDaysStr(START, w * 7 + d)))).flat();
    expect(levelAfter(records, 90)).toBeLessThan(40);
  });

  it('継続中なら継続日数、直近7日の回数を返す', () => {
    const result = calcMotivation(mondayWednesdayFriday(2), addDaysStr(START, 11))!; // 2週目の金曜
    expect(result.recentSessions).toBe(3);
    expect(result.continuousDays).toBe(8); // 1週目の金曜（3回目）から継続
  });

  it('週3回を下回ると継続が途切れる', () => {
    const result = calcMotivation(mondayWednesdayFriday(1), addDaysStr(START, 10))!;
    expect(result.recentSessions).toBeLessThan(3);
    expect(result.continuousDays).toBeNull();
  });

  it('記録日には「下がった値」と「上がった値」の2点があり、時刻は厳密に増加する', () => {
    const result = calcMotivation(mondayWednesdayFriday(2), addDaysStr(START, 13))!;
    const day = result.points.filter((p) => p.date === addDaysStr(START, 2));
    expect(day).toHaveLength(2);
    expect(day[1].level).toBeGreaterThan(day[0].level);
    const times = result.points.map((p) => p.time);
    for (let i = 1; i < times.length; i++) expect(times[i]).toBeGreaterThan(times[i - 1]);
  });

  it('70以上は好調、40以上は維持、それ未満は要注意', () => {
    expect(toMotivationStatus(70)).toBe('good');
    expect(toMotivationStatus(40)).toBe('steady');
    expect(toMotivationStatus(39.9)).toBe('warning');
  });
});
