import { NextRequest, NextResponse } from 'next/server';
import { frequencyGoalsRepository, type PeriodType } from '@/lib/repository/goals';

const VALID_PERIODS: PeriodType[] = ['week', 'month'];

export async function GET(request: NextRequest) {
  try {
    const periodParam = request.nextUrl.searchParams.get('period');
    const periodType = periodParam as PeriodType;
    if (!VALID_PERIODS.includes(periodType)) {
      return NextResponse.json({ error: 'period は week または month を指定してください。' }, { status: 400 });
    }

    const goals = await frequencyGoalsRepository.findByPeriod(periodType);
    return NextResponse.json(goals);
  } catch (error) {
    console.error('GET /api/goals/frequency:', error);
    return NextResponse.json({ error: '頻度目標の取得に失敗しました。' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as { periodType?: string; items?: { category?: string; target_count?: number }[] };
    const periodType = body.periodType as PeriodType;

    if (!VALID_PERIODS.includes(periodType) || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: 'periodType(week/month) と items は必須です。' },
        { status: 400 }
      );
    }

    const items = body.items.map((item) => ({
      category: String(item.category ?? ''),
      target_count: Number(item.target_count) || 0,
    }));

    const goals = await frequencyGoalsRepository.upsertMany(periodType, items);
    return NextResponse.json(goals);
  } catch (error) {
    console.error('PUT /api/goals/frequency:', error);
    return NextResponse.json({ error: '頻度目標の保存に失敗しました。' }, { status: 500 });
  }
}
