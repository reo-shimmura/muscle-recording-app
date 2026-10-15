import { NextRequest, NextResponse } from 'next/server';
import { exercisesRepository } from '@/lib/repository/exercises';
import { LIMITS, asObject, readJson, requireString, validationErrorResponse } from '@/lib/validation';

export async function GET() {
  try {
    const exercises = await exercisesRepository.findAll();
    return NextResponse.json(exercises);
  } catch (err) {
    console.error('GET /api/exercises error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = asObject(await readJson(request));
    const name = requireString(body.name, 'name', LIMITS.exerciseName);
    const category = requireString(body.category, 'category', LIMITS.category);
    const exercise = await exercisesRepository.upsert(name, category);
    return NextResponse.json(exercise, { status: 201 });
  } catch (err) {
    const invalid = validationErrorResponse(err);
    if (invalid) return invalid;
    console.error('POST /api/exercises error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
