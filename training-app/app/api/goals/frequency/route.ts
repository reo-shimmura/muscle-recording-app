import { NextRequest, NextResponse } from 'next/server';
import { frequencyGoalsRepository, type PeriodType } from '@/lib/repository/goals';
import {
  LIMITS,
  ValidationError,
  asObject,
  readJson,
  requireNumber,
  requireString,
  validationErrorResponse,
} from '@/lib/validation';

const VALID_PERIODS: PeriodType[] = ['week', 'month'];

function requirePeriod(value: unknown, field: string): PeriodType {
  if (!VALID_PERIODS.includes(value as PeriodType)) {
    throw new ValidationError(`${field} は week または month を指定してください。`);
  }
  return value as PeriodType;
}

export async function GET(request: NextRequest) {
  try {
    const periodType = requirePeriod(request.nextUrl.searchParams.get('period'), 'period');
    const goals = await frequencyGoalsRepository.findByPeriod(periodType);
    return NextResponse.json(goals);
  } catch (error) {
    const invalid = validationErrorResponse(error);
    if (invalid) return invalid;
    console.error('GET /api/goals/frequency:', error);
    return NextResponse.json({ error: '頻度目標の取得に失敗しました。' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = asObject(await readJson(request));
    const periodType = requirePeriod(body.periodType, 'periodType');
    if (!Array.isArray(body.items) || body.items.length > LIMITS.frequencyItems) {
      throw new ValidationError(`items は${LIMITS.frequencyItems}件以内の配列で指定してください。`);
    }

    const items = body.items.map((raw) => {
      const item = asObject(raw);
      return {
        // 週間目標（全体）は category を空文字で表す
        category: requireString(item.category ?? '', 'category', LIMITS.category, { allowEmpty: true }),
        target_count: requireNumber(item.target_count, 'target_count', { min: 0, max: 100, integer: true }),
      };
    });

    const goals = await frequencyGoalsRepository.upsertMany(periodType, items);
    return NextResponse.json(goals);
  } catch (error) {
    const invalid = validationErrorResponse(error);
    if (invalid) return invalid;
    console.error('PUT /api/goals/frequency:', error);
    return NextResponse.json({ error: '頻度目標の保存に失敗しました。' }, { status: 500 });
  }
}
