import { NextRequest, NextResponse } from 'next/server';
import { recordsRepository } from '@/lib/repository/records';
import { LIMITS, ValidationError, parseRecordInput, readJson, validationErrorResponse } from '@/lib/validation';

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
    const body = await readJson(request);

    if (Array.isArray(body)) {
      if (body.length === 0 || body.length > LIMITS.recordsPerRequest) {
        throw new ValidationError(`一度に保存できる記録は1〜${LIMITS.recordsPerRequest}件です。`);
      }
      const records = await recordsRepository.createMany(body.map(parseRecordInput));
      return NextResponse.json(records, { status: 201 });
    }

    const record = await recordsRepository.create(parseRecordInput(body));
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    const invalid = validationErrorResponse(error);
    if (invalid) return invalid;
    console.error('POST /api/records:', error);
    return NextResponse.json({ error: '記録の保存に失敗しました。' }, { status: 500 });
  }
}
