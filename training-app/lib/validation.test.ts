import { describe, expect, it } from 'vitest';
import { parseFoodIntakeInput, parseRecordInput, parseRecordPatch, ValidationError } from './validation';

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

describe('parseFoodIntakeInput', () => {
  it('日付・食品・量を受け取り、たんぱく質はサーバー側で食品の一覧から計算する', () => {
    expect(parseFoodIntakeInput({ date: '2026-11-22', food_key: 'egg', quantity: 2, protein_g: 999 })).toEqual({
      date: '2026-11-22',
      food_key: 'egg',
      quantity: 2,
      protein_g: 12.2,
    });
  });

  it('一覧にない食品はエラー', () => {
    expect(() => parseFoodIntakeInput({ date: '2026-11-22', food_key: 'pizza', quantity: 1 })).toThrow(ValidationError);
  });

  it('量が0以下・食品ごとの上限超え（プロテインは1杯30gまで）・数値でない場合はエラー', () => {
    expect(() => parseFoodIntakeInput({ date: '2026-11-22', food_key: 'egg', quantity: 0 })).toThrow(ValidationError);
    expect(() => parseFoodIntakeInput({ date: '2026-11-22', food_key: 'protein_powder', quantity: 31 })).toThrow(ValidationError);
    expect(() => parseFoodIntakeInput({ date: '2026-11-22', food_key: 'egg', quantity: 'たくさん' })).toThrow(ValidationError);
  });

  it('日付がない・不正な場合はエラー', () => {
    expect(() => parseFoodIntakeInput({ food_key: 'egg', quantity: 1 })).toThrow(ValidationError);
    expect(() => parseFoodIntakeInput({ date: '11/22', food_key: 'egg', quantity: 1 })).toThrow(ValidationError);
  });
});
