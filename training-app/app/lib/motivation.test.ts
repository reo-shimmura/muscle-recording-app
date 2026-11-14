import { describe, expect, it } from 'vitest';
import { calcIntensity, calcMotivation, toMotivationStatus, updateStability } from './motivation';
import type { TrainingRecord } from '../types';

function record(date: string, weight = 50, reps = 10, sets = 3): TrainingRecord {
  return { date, exercise: 'ベンチプレス', weight, reps, sets, duration_minutes: null, memo: '' };
}

describe('calcIntensity', () => {
  it('平均と同じ負荷量なら1、平均以上でも1を超えない', () => {
    expect(calcIntensity(1000, 1000)).toBe(1);
    expect(calcIntensity(3000, 1000)).toBe(1);
  });

  it('負荷量が0（有酸素のみ等）でも最低0.3を保証する', () => {
    expect(calcIntensity(0, 1000)).toBe(0.3);
    expect(calcIntensity(0, 0)).toBe(0.3);
  });

  it('平均の半分なら 0.3 と 1 の中間になる', () => {
    expect(calcIntensity(500, 1000)).toBeCloseTo(0.65);
  });
});

describe('updateStability', () => {
  it('3日以内に続けると定着度が伸び、上限21で止まる', () => {
    expect(updateStability(3, 2, 1)).toBe(5);
    expect(updateStability(20, 1, 1)).toBe(21);
  });

  it('8日以上空くと半分になるが、初期値3より下がらない', () => {
    expect(updateStability(10, 8, 1)).toBe(5);
    expect(updateStability(4, 30, 1)).toBe(3);
  });

  it('4〜7日の間隔なら変わらない', () => {
    expect(updateStability(10, 5, 1)).toBe(10);
  });
});

describe('toMotivationStatus', () => {
  it('70以上は好調、40以上は維持、それ未満は要注意', () => {
    expect(toMotivationStatus(70)).toBe('good');
    expect(toMotivationStatus(40)).toBe('steady');
    expect(toMotivationStatus(39.9)).toBe('warning');
  });
});

describe('calcMotivation', () => {
  it('記録がなければ null を返す', () => {
    expect(calcMotivation([], '2026-11-14')).toBeNull();
  });

  it('記録した日に跳ね上がり、その後は日ごとに下がる', () => {
    const result = calcMotivation([record('2026-11-10')], '2026-11-14');
    const levels = result!.points.map((p) => p.level);

    // 1回の記録では残りの半分までしか上がらない
    expect(levels[0]).toBe(50);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]).toBeLessThan(levels[i - 1]);
    }
    expect(result!.daysSinceLast).toBe(4);
  });

  it('2回目以降の記録日は「下がった値」と「跳ね上がった値」の2点を持つ', () => {
    const result = calcMotivation([record('2026-11-10'), record('2026-11-12')], '2026-11-12');
    const sessionDay = result!.points.filter((p) => p.date === '2026-11-12');

    expect(sessionDay).toHaveLength(2);
    expect(sessionDay[1].level).toBeGreaterThan(sessionDay[0].level);
    expect(sessionDay[1].isSession).toBe(true);
  });

  it('曲線補間できるよう、全ての点の時刻が厳密に増加している', () => {
    const result = calcMotivation(
      ['2026-11-01', '2026-11-02', '2026-11-05'].map((d) => record(d)),
      '2026-11-08'
    );
    const times = result!.points.map((p) => p.time);
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeGreaterThan(times[i - 1]);
    }
  });

  it('こまめに続けた方が、同じ日数空けたあとの値が高い（定着度の効果）', () => {
    const steady = calcMotivation(
      ['2026-11-01', '2026-11-03', '2026-11-05', '2026-11-07'].map((d) => record(d)),
      '2026-11-14'
    );
    const once = calcMotivation([record('2026-11-07')], '2026-11-14');

    expect(steady!.current).toBeGreaterThan(once!.current);
  });

  it('久しぶりの1回では急に戻らず、続けるほど積み上がる', () => {
    const result = calcMotivation(
      ['2026-07-15', '2026-11-05', '2026-11-07', '2026-11-10'].map((d) => record(d)),
      '2026-11-10'
    );
    const afterReturn = result!.points.find((p) => p.date === '2026-11-05' && p.isSession)!;
    const later = result!.points.find((p) => p.date === '2026-11-10' && p.isSession)!;

    expect(afterReturn.level).toBeLessThanOrEqual(50);
    expect(later.level).toBeGreaterThan(afterReturn.level);
  });

  it('長く空くと要注意になる', () => {
    const result = calcMotivation([record('2026-10-01')], '2026-11-14');
    expect(result!.status).toBe('warning');
    expect(result!.daysSinceLast).toBe(44);
  });
});
