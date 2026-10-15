import { NextRequest, NextResponse } from 'next/server';
import { longTermGoalsRepository } from '@/lib/repository/goals';
import { requireId, validationErrorResponse } from '@/lib/validation';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const id = requireId((await params).id);

    const deleted = await longTermGoalsRepository.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: '目標が見つかりません。' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const invalid = validationErrorResponse(error);
    if (invalid) return invalid;
    console.error('DELETE /api/goals/long-term/[id]:', error);
    return NextResponse.json({ error: '目標の削除に失敗しました。' }, { status: 500 });
  }
}
