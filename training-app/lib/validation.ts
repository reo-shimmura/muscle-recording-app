import { NextResponse, type NextRequest } from 'next/server';

export class ValidationError extends Error {}

export const LIMITS = {
  exerciseName: 50,
  category: 20,
  memo: 500,
  unit: 10,
  recordsPerRequest: 100,
  frequencyItems: 20,
} as const;

export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError('リクエストの形式が不正です。');
  }
}

export function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ValidationError('リクエストの形式が不正です。');
  }
  return value as Record<string, unknown>;
}

export function requireString(value: unknown, field: string, maxLength: number, { allowEmpty = false } = {}): string {
  if (typeof value !== 'string') throw new ValidationError(`${field} は文字列で指定してください。`);
  const trimmed = value.trim();
  if (!allowEmpty && trimmed === '') throw new ValidationError(`${field} は必須です。`);
  if (trimmed.length > maxLength) throw new ValidationError(`${field} は${maxLength}文字以内で指定してください。`);
  return trimmed;
}

export function requireNumber(
  value: unknown,
  field: string,
  { min, max, integer = false }: { min: number; max: number; integer?: boolean }
): number {
  const num = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof num !== 'number' || !Number.isFinite(num)) throw new ValidationError(`${field} は数値で指定してください。`);
  if (integer && !Number.isInteger(num)) throw new ValidationError(`${field} は整数で指定してください。`);
  if (num < min || num > max) throw new ValidationError(`${field} は${min}〜${max}の範囲で指定してください。`);
  return num;
}

export function requireDate(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError(`${field} は YYYY-MM-DD 形式で指定してください。`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new ValidationError(`${field} が不正な日付です。`);
  }
  return value;
}

export function requireId(value: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new ValidationError('無効なIDです。');
  return id;
}

export interface RecordFields {
  date: string;
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  duration_minutes: number | null;
  memo: string;
}

const recordFieldParsers: { [K in keyof RecordFields]: (value: unknown) => RecordFields[K] } = {
  date: (v) => requireDate(v, 'date'),
  exercise: (v) => requireString(v, 'exercise', LIMITS.exerciseName),
  weight: (v) => requireNumber(v, 'weight', { min: 0, max: 1000 }),
  reps: (v) => requireNumber(v, 'reps', { min: 0, max: 10000, integer: true }),
  sets: (v) => requireNumber(v, 'sets', { min: 0, max: 1000, integer: true }),
  duration_minutes: (v) => (v === null ? null : requireNumber(v, 'duration_minutes', { min: 0, max: 1440 })),
  memo: (v) => requireString(v, 'memo', LIMITS.memo, { allowEmpty: true }),
};

export function parseRecordPatch(raw: unknown): Partial<RecordFields> {
  const body = asObject(raw);
  const patch: Partial<RecordFields> = {};
  for (const key of Object.keys(recordFieldParsers) as (keyof RecordFields)[]) {
    if (body[key] !== undefined) {
      (patch as Record<string, unknown>)[key] = recordFieldParsers[key](body[key]);
    }
  }
  return patch;
}

export function parseRecordInput(raw: unknown): RecordFields {
  const body = asObject(raw);
  const patch = parseRecordPatch(body);
  if (patch.date === undefined) throw new ValidationError('date は必須です。');
  if (patch.exercise === undefined) throw new ValidationError('exercise は必須です。');
  return {
    date: patch.date,
    exercise: patch.exercise,
    weight: patch.weight ?? 0,
    // 有酸素種目は reps/sets を 0 で送ってくるが、従来どおり 1 として保存する
    reps: patch.reps || 1,
    sets: patch.sets || 1,
    duration_minutes: patch.duration_minutes ?? null,
    memo: patch.memo ?? '',
  };
}

export function validationErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return null;
}
