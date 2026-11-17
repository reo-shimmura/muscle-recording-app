import { NextRequest, NextResponse } from 'next/server';
import { proteinIntakesRepository } from '@/lib/repository/proteinIntakes';
import { parseProteinIntakeInput, readJson, validationErrorResponse } from '@/lib/validation';

export async function GET() {
  try {
    const intakes = await proteinIntakesRepository.findAll();
    return NextResponse.json(intakes);
  } catch (error) {
    console.error('GET /api/protein-intakes:', error);
    return NextResponse.json({ error: 'プロテインの記録の取得に失敗しました。' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, amount_g } = parseProteinIntakeInput(await readJson(request));
    const intake = await proteinIntakesRepository.create(date, amount_g);
    return NextResponse.json(intake, { status: 201 });
  } catch (error) {
    const invalid = validationErrorResponse(error);
    if (invalid) return invalid;
    console.error('POST /api/protein-intakes:', error);
    return NextResponse.json({ error: 'プロテインの記録の保存に失敗しました。' }, { status: 500 });
  }
}
