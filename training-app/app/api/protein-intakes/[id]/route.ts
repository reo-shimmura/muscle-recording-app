import { NextRequest, NextResponse } from 'next/server';
import { proteinIntakesRepository } from '@/lib/repository/proteinIntakes';
import { requireId, validationErrorResponse } from '@/lib/validation';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const id = requireId((await params).id);

    const deleted = await proteinIntakesRepository.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'プロテインの記録が見つかりません。' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const invalid = validationErrorResponse(error);
    if (invalid) return invalid;
    console.error('DELETE /api/protein-intakes/[id]:', error);
    return NextResponse.json({ error: 'プロテインの記録の削除に失敗しました。' }, { status: 500 });
  }
}
