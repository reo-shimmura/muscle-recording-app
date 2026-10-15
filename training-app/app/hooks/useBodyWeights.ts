'use client'

import { useCallback, useState } from 'react';
import type { BodyWeight, AlertMessage } from '../types';

interface UseBodyWeightsReturn {
  bodyWeights: BodyWeight[];
  loading: boolean;
  fetchBodyWeights: () => Promise<void>;
  saveBodyWeight: (date: string, weightKg: number) => Promise<boolean>;
  deleteBodyWeight: (id: number) => Promise<void>;
}

export function useBodyWeights(showMessage: (msg: AlertMessage) => void): UseBodyWeightsReturn {
  const [bodyWeights, setBodyWeights] = useState<BodyWeight[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBodyWeights = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/body-weights');
      if (!res.ok) throw new Error(`body-weights: ${res.status}`);
      const data: BodyWeight[] = await res.json();
      setBodyWeights(data);
    } catch (e: unknown) {
      console.error('体重データ読込エラー:', e instanceof Error ? e.message : e);
      showMessage({ type: 'error', text: '体重データの読込に失敗しました。' });
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  const saveBodyWeight = useCallback(
    async (date: string, weightKg: number): Promise<boolean> => {
      try {
        const res = await fetch('/api/body-weights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, weight_kg: weightKg }),
        });
        if (!res.ok) throw new Error(`Save failed: ${res.status}`);
        const saved: BodyWeight = await res.json();
        setBodyWeights((prev) => [...prev.filter((b) => b.date !== saved.date), saved].sort((a, b) => a.date.localeCompare(b.date)));
        showMessage({ type: 'success', text: '✅ 体重を記録しました！' });
        return true;
      } catch (err: unknown) {
        console.error('体重の保存に失敗:', err instanceof Error ? err.message : err);
        showMessage({ type: 'error', text: '体重の保存に失敗しました。' });
        return false;
      }
    },
    [showMessage]
  );

  const deleteBodyWeight = useCallback(
    async (id: number) => {
      try {
        const res = await fetch(`/api/body-weights/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
        setBodyWeights((prev) => prev.filter((b) => b.id !== id));
      } catch (err: unknown) {
        console.error('体重の削除に失敗:', err instanceof Error ? err.message : err);
        showMessage({ type: 'error', text: '体重の削除に失敗しました。' });
      }
    },
    [showMessage]
  );

  return { bodyWeights, loading, fetchBodyWeights, saveBodyWeight, deleteBodyWeight };
}
