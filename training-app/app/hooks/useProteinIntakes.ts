'use client'

import { useCallback, useState } from 'react';
import type { ProteinIntake, AlertMessage } from '../types';

interface UseProteinIntakesReturn {
  proteinIntakes: ProteinIntake[];
  loading: boolean;
  fetchProteinIntakes: () => Promise<void>;
  saveProteinIntake: (date: string, amountG: number) => Promise<boolean>;
  deleteProteinIntake: (id: number) => Promise<void>;
}

/** 日付順（同じ日は登録順）に並べる */
function sortIntakes(intakes: ProteinIntake[]): ProteinIntake[] {
  return [...intakes].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
}

/** プロテインの摂取記録の取得・保存・削除をまとめて扱う */
export function useProteinIntakes(showMessage: (msg: AlertMessage) => void): UseProteinIntakesReturn {
  const [proteinIntakes, setProteinIntakes] = useState<ProteinIntake[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProteinIntakes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/protein-intakes');
      if (!res.ok) throw new Error(`protein-intakes: ${res.status}`);
      const data: ProteinIntake[] = await res.json();
      setProteinIntakes(sortIntakes(data));
    } catch (e: unknown) {
      console.error('プロテインの記録の読込エラー:', e instanceof Error ? e.message : e);
      showMessage({ type: 'error', text: 'プロテインの記録の読込に失敗しました。' });
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  const saveProteinIntake = useCallback(
    async (date: string, amountG: number): Promise<boolean> => {
      try {
        const res = await fetch('/api/protein-intakes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, amount_g: amountG }),
        });
        if (!res.ok) throw new Error(`Save failed: ${res.status}`);
        const saved: ProteinIntake = await res.json();
        setProteinIntakes((prev) => sortIntakes([...prev, saved]));
        showMessage({ type: 'success', text: `プロテイン ${saved.amount_g}g を記録しました！` });
        return true;
      } catch (err: unknown) {
        console.error('プロテインの記録の保存に失敗:', err instanceof Error ? err.message : err);
        showMessage({ type: 'error', text: 'プロテインの記録の保存に失敗しました。' });
        return false;
      }
    },
    [showMessage]
  );

  const deleteProteinIntake = useCallback(
    async (id: number) => {
      try {
        const res = await fetch(`/api/protein-intakes/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
        setProteinIntakes((prev) => prev.filter((p) => p.id !== id));
      } catch (err: unknown) {
        console.error('プロテインの記録の削除に失敗:', err instanceof Error ? err.message : err);
        showMessage({ type: 'error', text: 'プロテインの記録の削除に失敗しました。' });
      }
    },
    [showMessage]
  );

  return { proteinIntakes, loading, fetchProteinIntakes, saveProteinIntake, deleteProteinIntake };
}
