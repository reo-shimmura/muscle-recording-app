import { NextRequest, NextResponse } from 'next/server';
import { longTermGoalsRepository, type GoalMetric } from '@/lib/repository/goals';
import {
  LIMITS,
  ValidationError,
  asObject,
  readJson,
  requireNumber,
  requireString,
  validationErrorResponse,
} from '@/lib/validation';

const VALID_METRICS: GoalMetric[] = ['max_weight', 'total_sets', 'total_reps'];

export async function GET() {
  try {
    const goals = await longTermGoalsRepository.findAll();
    return NextResponse.json(goals);
  } catch (error) {
    console.error('GET /api/goals/long-term:', error);
    return NextResponse.json({ error: '長期目標の取得に失敗しました。' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = asObject(await readJson(request));
    const metric = body.metric as GoalMetric;
    if (!VALID_METRICS.includes(metric)) {
      throw new ValidationError(`metric は ${VALID_METRICS.join(' / ')} のいずれかを指定してください。`);
    }

    const goal = await longTermGoalsRepository.create({
      exercise: requireString(body.exercise, 'exercise', LIMITS.exerciseName),
      metric,
      target_value: requireNumber(body.target_value, 'target_value', { min: 0.01, max: 100000 }),
      unit: requireString(body.unit, 'unit', LIMITS.unit),
    });
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    const invalid = validationErrorResponse(error);
    if (invalid) return invalid;
    console.error('POST /api/goals/long-term:', error);
    return NextResponse.json({ error: '長期目標の保存に失敗しました。' }, { status: 500 });
  }
}
