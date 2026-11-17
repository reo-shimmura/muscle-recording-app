import { describe, expect, it } from 'vitest';
import { parseRecordInput, parseRecordPatch, ValidationError } from './validation';

const base = { date: '2026-11-17', exercise: 'ランニング', weight: 0, reps: 0, sets: 0, duration_minutes: 30, memo: '' };

describe('parseRecordInput（距離）', () => {
  it('距離（km）を受け取って保存する', () => {
    expect(parseRecordInput({ ...base, distance_km: 5.2 }).distance_km).toBe(5.2);
  });

  it('距離が未指定・null なら null（任意項目）', () => {
    expect(parseRecordInput(base).distance_km).toBeNull();
    expect(parseRecordInput({ ...base, distance_km: null }).distance_km).toBeNull();
  });

  it('距離がマイナス・1000kmを超える・数値でない場合はエラー', () => {
    expect(() => parseRecordInput({ ...base, distance_km: -1 })).toThrow(ValidationError);
    expect(() => parseRecordInput({ ...base, distance_km: 1001 })).toThrow(ValidationError);
    expect(() => parseRecordInput({ ...base, distance_km: '5km' })).toThrow(ValidationError);
  });
});

describe('parseRecordPatch（距離）', () => {
  it('更新時は指定されたときだけ距離を含める', () => {
    expect(parseRecordPatch({ memo: 'メモだけ更新' })).not.toHaveProperty('distance_km');
    expect(parseRecordPatch({ distance_km: 3 })).toEqual({ distance_km: 3 });
  });
});
