'use client'

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AlertMessage from '../components/AlertMessage';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.replace('/');
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? 'ログインに失敗しました。');
    } catch {
      setError('ログインに失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <h2>ログイン</h2>
        {error && <AlertMessage message={{ type: 'error', text: error }} />}
        <form onSubmit={handleSubmit}>
          <label htmlFor="password">パスワード</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
          <Button type="submit" className="mt-4 w-full" disabled={submitting || !password}>
            {submitting ? 'ログイン中...' : 'ログイン'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
