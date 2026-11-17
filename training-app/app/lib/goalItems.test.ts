import { describe, expect, it } from 'vitest';
import { buildHabitItems, buildLongTermItems, buildMonthlyItems, hasAnyGoal, type HabitSources } from './goalItems';
import type { FrequencyGoal, LongTermGoal, TrainingRecord } from '../types';

// 2026-11-17（火）の週は 11/16（月）〜11/22（日）
const now = new Date(2026, 10, 17, 9, 0);

function record(date: string, overrides: Partial<TrainingRecord> = {}): TrainingRecord {
  return { date, exercise: 'ベンチプレス', weight: 50, reps: 10, sets: 3, memo: '', ...overrides };
}

function weekly(id: number, category: string, target_count: number): FrequencyGoal {
  return { id, period_type: 'week', category, target_count };
}

const sources: HabitSources = {
  weeklyGoal: weekly(1, '', 3),
  habitGoals: { protein: weekly(2, 'プロテイン', 5), bodyWeight: null },
  records: [record('2026-11-16'), record('2026-11-17'), record('2026-11-10')],
  proteinIntakes: [{ id: 1, date: '2026-11-16', amount_g: 30 }, { id: 2, date: '2026-11-16', amount_g: 15 }],
  bodyWeights: [{ id: 1, date: '2026-11-17', weight_kg: 70 }],
};

describe('buildHabitItems', () => {
  it('筋トレ・プロテイン摂取・体重計の記録の3つを、この順で常に返す', () => {
    expect(buildHabitItems(sources, now).map((i) => i.label)).toEqual(['筋トレ', 'プロテイン摂取', '体重計の記録']);
  });

  it('目標がある習慣は、今週の実績と達成率を出す', () => {
    const [training, protein] = buildHabitItems(sources, now);
    expect(training).toMatchObject({ current: 2, target: 3, percent: 67, unit: '回', goalId: 1 });
    expect(protein).toMatchObject({ current: 1, target: 5, percent: 20, unit: '日' });
  });

  it('目標が未設定（または0）でも、今週の実績だけは出す', () => {
    const bodyWeight = buildHabitItems(sources, now)[2];
    expect(bodyWeight).toMatchObject({ current: 1, target: null, percent: 0, goalId: null });

    const zero = buildHabitItems({ ...sources, weeklyGoal: weekly(1, '', 0) }, now)[0];
    expect(zero).toMatchObject({ current: 2, target: null });
  });
});

describe('buildLongTermItems', () => {
  const goals: LongTermGoal[] = [
    { id: 1, exercise: 'ベンチプレス', metric: 'max_weight', target_value: 100, unit: 'kg' },
    { id: 2, exercise: 'ベンチプレス', metric: 'total_sets', target_value: 4, unit: 'セット' },
  ];
  const records = [record('2026-11-16')];

  it('指標名付きのラベルにし、limit がなければ渡された順のまま全件返す', () => {
    const items = buildLongTermItems(goals, records);
    expect(items.map((i) => i.label)).toEqual(['ベンチプレス（最大重量）', 'ベンチプレス（累計セット数）']);
    expect(items[0]).toMatchObject({ current: 50, target: 100, percent: 50, goalId: 1 });
  });

  it('limit を指定すると、達成率の低い順に絞る', () => {
    const items = buildLongTermItems(goals, records, 1);
    expect(items).toHaveLength(1);
    expect(items[0].goalId).toBe(1); // 50% の方（累計セット数は 75%）
  });
});

describe('buildMonthlyItems', () => {
  it('目標回数が0のカテゴリは含めず、達成率の低い順に並べる', () => {
    const goals: FrequencyGoal[] = [
      { id: 1, period_type: 'month', category: '胸', target_count: 2 },
      { id: 2, period_type: 'month', category: '脚', target_count: 4 },
      { id: 3, period_type: 'month', category: '背中', target_count: 0 },
    ];
    const records = [record('2026-11-03'), record('2026-11-05'), record('2026-11-06', { exercise: 'スクワット' })];
    const items = buildMonthlyItems(goals, records, { ベンチプレス: '胸', スクワット: '脚' }, now);

    expect(items.map((i) => [i.label, i.current, i.percent])).toEqual([
      ['脚', 1, 25],
      ['胸', 2, 100],
    ]);
  });
});

describe('hasAnyGoal', () => {
  it('目標が1つでも設定されていれば true（未設定の習慣は数えない）', () => {
    expect(hasAnyGoal(buildHabitItems(sources, now))).toBe(true);
    const none = buildHabitItems({ ...sources, weeklyGoal: null, habitGoals: { protein: null, bodyWeight: null } }, now);
    expect(hasAnyGoal(none)).toBe(false);
  });
});
