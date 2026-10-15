import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  isAuthConfigured,
  verifyPassword,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!isAuthConfigured()) {
    console.error('APP_PASSWORD または AUTH_SECRET(32文字以上) が設定されていません。');
    return NextResponse.json({ error: 'サーバーの認証設定が未完了です。' }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!(await verifyPassword(password))) {
    return NextResponse.json({ error: 'パスワードが違います。' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
