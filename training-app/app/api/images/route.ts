import { NextRequest, NextResponse } from 'next/server';
import { imagesRepository } from '@/lib/repository/images';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';

export async function GET() {
  try {
    const images = await imagesRepository.findAll();
    return NextResponse.json(images);
  } catch (error) {
    console.error('GET /api/images:', error);
    return NextResponse.json({ error: '画像一覧の取得に失敗しました。' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const date = formData.get('date') as string | null;
    const recordIdRaw = formData.get('record_id') as string | null;

    if (!file || !date) {
      return NextResponse.json({ error: 'file と date は必須です。' }, { status: 400 });
    }

    const dateStr = date.replace(/-/g, '');
    const ext = path.extname(file.name) || '.jpg';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${dateStr}_${Date.now()}_${safeName}${ext === path.extname(safeName) ? '' : ext}`;

    let imagePath: string;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(filename, file, { access: 'public' });
      imagePath = blob.url;
    } else {
      imagePath = `/uploads/${filename}`;
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadsDir, { recursive: true });
      const bytes = await file.arrayBuffer();
      await writeFile(path.join(uploadsDir, filename), Buffer.from(bytes));
    }

    const image = await imagesRepository.create({
      date,
      record_id: recordIdRaw ? Number(recordIdRaw) : null,
      image_path: imagePath,
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error('POST /api/images:', error);
    return NextResponse.json({ error: '画像のアップロードに失敗しました。' }, { status: 500 });
  }
}
