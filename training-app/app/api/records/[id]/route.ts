import { NextRequest, NextResponse } from 'next/server';
import { recordsRepository } from '@/lib/repository/records';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (isNaN(numId)) {
      return NextResponse.json({ error: '無効なIDです。' }, { status: 400 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const updated = await recordsRepository.update(numId, {
      date: body.date !== undefined ? String(body.date) : undefined,
      exercise: body.exercise !== undefined ? String(body.exercise) : undefined,
      weight: body.weight !== undefined ? Number(body.weight) : undefined,
      reps: body.reps !== undefined ? Number(body.reps) : undefined,
      sets: body.sets !== undefined ? Number(body.sets) : undefined,
      memo: body.memo !== undefined ? String(body.memo) : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: '記録が見つかりません。' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/records/[id]:', error);
    return NextResponse.json({ error: '記録の更新に失敗しました。' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (isNaN(numId)) {
      return NextResponse.json({ error: '無効なIDです。' }, { status: 400 });
    }

    const deleted = await recordsRepository.delete(numId);
    if (!deleted) {
      return NextResponse.json({ error: '記録が見つかりません。' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/records/[id]:', error);
    return NextResponse.json({ error: '記録の削除に失敗しました。' }, { status: 500 });
  }
}
