import { NextRequest, NextResponse } from 'next/server';
import { exercisesRepository } from '../../../lib/repository/exercises';

export async function GET() {
  try {
    const exercises = exercisesRepository.findAll();
    return NextResponse.json(exercises);
  } catch (err) {
    console.error('GET /api/exercises error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, category } = await request.json();
    if (!name?.trim() || !category?.trim()) {
      return NextResponse.json({ error: 'name と category は必須です' }, { status: 400 });
    }
    const exercise = exercisesRepository.upsert(name.trim(), category.trim());
    return NextResponse.json(exercise, { status: 201 });
  } catch (err) {
    console.error('POST /api/exercises error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
