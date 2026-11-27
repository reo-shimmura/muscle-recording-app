import { describe, expect, it } from 'vitest';
import { CARDIO_METRIC_OPTIONS, STRENGTH_METRIC_OPTIONS } from './goals';

const ALL = [...STRENGTH_METRIC_OPTIONS, ...CARDIO_METRIC_OPTIONS];
const stepOf = (value: string) => ALL.find((m) => m.value === value)?.step;

describe('長期目標の指標の入力の刻み', () => {
  it('重量（kg）と距離（km）は 0.5 刻み（.0 か .5 を入力できる）', () => {
    expect(stepOf('max_weight')).toBe(0.5);
    expect(stepOf('total_distance')).toBe(0.5);
  });

  it('セット数・回数・時間（分）は整数', () => {
    expect(stepOf('total_sets')).toBe(1);
    expect(stepOf('total_reps')).toBe(1);
    expect(stepOf('total_duration')).toBe(1);
  });

  it('すべての指標に刻みがあり、0.5 か 1 のどちらか（.1 などの中途半端な刻みにしない）', () => {
    for (const metric of ALL) {
      expect([0.5, 1]).toContain(metric.step);
    }
  });
});
