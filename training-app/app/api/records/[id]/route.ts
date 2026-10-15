import { NextRequest, NextResponse } from 'next/server';
import { recordsRepository } from '@/lib/repository/records';
import { parseRecordPatch, readJson, requireId, validationErrorResponse } from '@/lib/validation';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const id = requireId((await params).id);
    const patch = parseRecordPatch(await readJson(request));

    const updated = await recordsRepository.update(id, patch);
    if (!updated) {
      return NextResponse.json({ error: '記録が見つかりません。' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    const invalid = validationErrorResponse(error);
    if (invalid) return invalid;
    console.error('PUT /api/records/[id]:', error);
    return NextResponse.json({ error: '記録の更新に失敗しました。' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const id = requireId((await params).id);

    const deleted = await recordsRepository.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: '記録が見つかりません。' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const invalid = validationErrorResponse(error);
    if (invalid) return invalid;
    console.error('DELETE /api/records/[id]:', error);
    return NextResponse.json({ error: '記録の削除に失敗しました。' }, { status: 500 });
  }
}
