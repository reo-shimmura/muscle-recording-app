import { NextRequest, NextResponse } from 'next/server';
import { bodyWeightsRepository } from '@/lib/repository/bodyWeights';
import { requireId, validationErrorResponse } from '@/lib/validation';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const id = requireId((await params).id);

    const deleted = await bodyWeightsRepository.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: '体重データが見つかりません。' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const invalid = validationErrorResponse(error);
    if (invalid) return invalid;
    console.error('DELETE /api/body-weights/[id]:', error);
    return NextResponse.json({ error: '体重データの削除に失敗しました。' }, { status: 500 });
  }
}
