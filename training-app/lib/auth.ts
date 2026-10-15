export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = '';
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return toBase64Url(await crypto.subtle.sign('HMAC', key, encoder.encode(data)));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function getSecret(): string | null {
  const secret = process.env.AUTH_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.APP_PASSWORD) && getSecret() !== null;
}

export async function verifyPassword(input: string): Promise<boolean> {
  const password = process.env.APP_PASSWORD;
  const secret = getSecret();
  if (!password || !secret) return false;
  // 両方をHMACして固定長で比較し、長さや内容による応答時間の差をなくす
  const [a, b] = await Promise.all([hmac(secret, input), hmac(secret, password)]);
  return timingSafeEqual(a, b);
}

// パスワードも鍵に含め、パスワード変更時に既存セッションを無効化する
function getSigningKey(): string | null {
  const secret = getSecret();
  const password = process.env.APP_PASSWORD;
  return secret && password ? `${secret}:${password}` : null;
}

export async function createSessionToken(): Promise<string> {
  const key = getSigningKey();
  if (!key) throw new Error('Auth is not configured');
  const expiresAt = String(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  return `${expiresAt}.${await hmac(key, expiresAt)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const key = getSigningKey();
  if (!token || !key) return false;
  const [expiresAt, signature] = token.split('.');
  if (!expiresAt || !signature || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) < Date.now()) return false;
  return timingSafeEqual(signature, await hmac(key, expiresAt));
}
