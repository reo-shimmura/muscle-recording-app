import { NextRequest, NextResponse } from 'next/server';
import { recordsRepository } from '@/lib/repository/records';

export async function GET() {
  try {
    const records = await recordsRepository.findAll();
    return NextResponse.json(records);
  } catch (error) {
    console.error('GET /api/records:', error);
    return NextResponse.json({ error: 'データの取得に失敗しました。' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (Array.isArray(body)) {
      const records = await recordsRepository.createMany(
        body.map((item) => ({
          date: String(item.date),
          exercise: String(item.exercise),
          weight: Number(item.weight) || 0,
          reps: Number(item.reps) || 1,
          sets: Number(item.sets) || 1,
          memo: String(item.memo ?? ''),
        }))
      );
      return NextResponse.json(records, { status: 201 });
    }

    const item = body as Record<string, unknown>;
    if (!item.date || !item.exercise) {
      return NextResponse.json({ error: 'date と exercise は必須です。' }, { status: 400 });
    }

    const record = await recordsRepository.create({
      date: String(item.date),
      exercise: String(item.exercise),
      weight: Number(item.weight) || 0,
      reps: Number(item.reps) || 1,
      sets: Number(item.sets) || 1,
      memo: String(item.memo ?? ''),
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('POST /api/records:', error);
    return NextResponse.json({ error: '記録の保存に失敗しました。' }, { status: 500 });
  }
}
