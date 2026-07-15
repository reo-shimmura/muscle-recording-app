import { NextRequest, NextResponse } from 'next/server';
import { longTermGoalsRepository, type GoalMetric } from '@/lib/repository/goals';

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
    const body = (await request.json()) as Record<string, unknown>;
    const metric = String(body.metric) as GoalMetric;

    if (!body.exercise || !VALID_METRICS.includes(metric) || !body.target_value || !body.unit) {
      return NextResponse.json(
        { error: 'exercise, metric, target_value, unit は必須です。' },
        { status: 400 }
      );
    }

    const goal = await longTermGoalsRepository.create({
      exercise: String(body.exercise),
      metric,
      target_value: Number(body.target_value),
      unit: String(body.unit),
    });
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('POST /api/goals/long-term:', error);
    return NextResponse.json({ error: '長期目標の保存に失敗しました。' }, { status: 500 });
  }
}
