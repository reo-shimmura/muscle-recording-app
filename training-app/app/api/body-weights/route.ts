import { NextRequest, NextResponse } from 'next/server';
import { bodyWeightsRepository } from '@/lib/repository/bodyWeights';
import { asObject, readJson, requireDate, requireNumber, validationErrorResponse } from '@/lib/validation';

export async function GET() {
  try {
    const bodyWeights = await bodyWeightsRepository.findAll();
    return NextResponse.json(bodyWeights);
  } catch (error) {
    console.error('GET /api/body-weights:', error);
    return NextResponse.json({ error: '体重データの取得に失敗しました。' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = asObject(await readJson(request));
    const date = requireDate(body.date, 'date');
    const weightKg = requireNumber(body.weight_kg, 'weight_kg', { min: 1, max: 500 });

    const bodyWeight = await bodyWeightsRepository.upsert(date, weightKg);
    return NextResponse.json(bodyWeight, { status: 201 });
  } catch (error) {
    const invalid = validationErrorResponse(error);
    if (invalid) return invalid;
    console.error('POST /api/body-weights:', error);
    return NextResponse.json({ error: '体重データの保存に失敗しました。' }, { status: 500 });
  }
}
