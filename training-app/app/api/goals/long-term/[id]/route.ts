import { NextRequest, NextResponse } from 'next/server';
import { longTermGoalsRepository } from '@/lib/repository/goals';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (isNaN(numId)) {
      return NextResponse.json({ error: '無効なIDです。' }, { status: 400 });
    }

    const deleted = await longTermGoalsRepository.delete(numId);
    if (!deleted) {
      return NextResponse.json({ error: '目標が見つかりません。' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/goals/long-term/[id]:', error);
    return NextResponse.json({ error: '目標の削除に失敗しました。' }, { status: 500 });
  }
}
