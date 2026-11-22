import { NextRequest, NextResponse } from 'next/server';
import { foodIntakesRepository } from '@/lib/repository/foodIntakes';
import { parseFoodIntakeInput, readJson, validationErrorResponse } from '@/lib/validation';

export async function GET() {
  try {
    const intakes = await foodIntakesRepository.findAll();
    return NextResponse.json(intakes);
  } catch (error) {
    console.error('GET /api/food-intakes:', error);
    return NextResponse.json({ error: 'たんぱく質の記録の取得に失敗しました。' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const intake = await foodIntakesRepository.create(parseFoodIntakeInput(await readJson(request)));
    return NextResponse.json(intake, { status: 201 });
  } catch (error) {
    const invalid = validationErrorResponse(error);
    if (invalid) return invalid;
    console.error('POST /api/food-intakes:', error);
    return NextResponse.json({ error: 'たんぱく質の記録の保存に失敗しました。' }, { status: 500 });
  }
}
