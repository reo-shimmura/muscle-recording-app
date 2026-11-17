import { describe, expect, it } from 'vitest';
import { calcLongTermGoalProgress, calcWeeklyDaysProgress, calcWeeklyGoalProgress } from './goalsProgress';
import type { FrequencyGoal, GoalMetric, LongTermGoal, TrainingRecord } from '../types';

function record(overrides: Partial<TrainingRecord>): TrainingRecord {
  return { date: '2026-11-10', exercise: 'ベンチプレス', weight: 50, reps: 10, sets: 3, memo: '', ...overrides };
}

function goal(exercise: string, metric: GoalMetric, target_value: number): LongTermGoal {
  return { id: 1, exercise, metric, target_value, unit: '' };
}

describe('calcLongTermGoalProgress（筋トレ）', () => {
  const records = [record({ weight: 50, reps: 10, sets: 3 }), record({ weight: 60, reps: 5, sets: 2 })];

  it('最大重量・累計セット数・累計回数', () => {
    expect(calcLongTermGoalProgress(goal('ベンチプレス', 'max_weight', 80), records).current).toBe(60);
    expect(calcLongTermGoalProgress(goal('ベンチプレス', 'total_sets', 10), records).current).toBe(5);
    expect(calcLongTermGoalProgress(goal('ベンチプレス', 'total_reps', 100), records).current).toBe(40);
  });
});

describe('calcLongTermGoalProgress（ランニングの累計距離・時間）', () => {
  const runs = [
    record({ exercise: 'ランニング', weight: 0, duration_minutes: 30, distance_km: 5.2 }),
    record({ exercise: 'ランニング', weight: 0, duration_minutes: 25.5, distance_km: null }),
    record({ exercise: 'ランニング', weight: 0, duration_minutes: 40, distance_km: 7.15 }),
    record({ exercise: 'ベンチプレス' }),
  ];

  it('累計距離は、その種目の距離（km）を合計する。距離のない記録は0として扱う', () => {
    const progress = calcLongTermGoalProgress(goal('ランニング', 'total_distance', 100), runs);
    expect(progress.current).toBe(12.4); // 5.2 + 7.15 = 12.35 → 小数第1位に丸める
    expect(progress.percent).toBe(12);
  });

  it('累計時間は、その種目の時間（分）を合計する', () => {
    const progress = calcLongTermGoalProgress(goal('ランニング', 'total_duration', 600), runs);
    expect(progress.current).toBe(95.5);
    expect(progress.percent).toBe(16);
  });

  it('達成率は100%を超えない', () => {
    expect(calcLongTermGoalProgress(goal('ランニング', 'total_distance', 10), runs).percent).toBe(100);
  });
});

describe('calcWeeklyDaysProgress（今週の記録日数）', () => {
  // 2026-11-17（火）の週は 11/16（月）〜11/22（日）
  const now = new Date(2026, 10, 17, 9, 0);

  it('今週（月〜日）に記録がある日数を数え、同じ日の複数記録は1日とする', () => {
    const progress = calcWeeklyDaysProgress(3, ['2026-11-15', '2026-11-16', '2026-11-16', '2026-11-17', '2026-11-23'], now);
    expect(progress).toEqual({ current: 2, target: 3, percent: 67 });
  });

  it('筋トレの週間目標も同じ数え方をする', () => {
    const weekly: FrequencyGoal = { id: 1, period_type: 'week', category: '', target_count: 2 };
    expect(calcWeeklyGoalProgress(weekly, [record({ date: '2026-11-16' }), record({ date: '2026-11-18' })], now).percent).toBe(100);
  });
});
