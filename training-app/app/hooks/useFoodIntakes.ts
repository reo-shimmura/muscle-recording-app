'use client'

import { useCallback, useState } from 'react';
import type { FoodIntake, AlertMessage } from '../types';
import { FOOD_BY_KEY } from '../constants/foods';

interface UseFoodIntakesReturn {
  foodIntakes: FoodIntake[];
  loading: boolean;
  fetchFoodIntakes: () => Promise<void>;
  saveFoodIntake: (date: string, foodKey: string, quantity: number) => Promise<boolean>;
  deleteFoodIntake: (id: number) => Promise<void>;
}

/** 日付順（同じ日は登録順）に並べる */
function sortIntakes(intakes: FoodIntake[]): FoodIntake[] {
  return [...intakes].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
}

/** たんぱく質の摂取記録（プロテイン・卵・肉など）の取得・保存・削除をまとめて扱う */
export function useFoodIntakes(showMessage: (msg: AlertMessage) => void): UseFoodIntakesReturn {
  const [foodIntakes, setFoodIntakes] = useState<FoodIntake[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFoodIntakes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/food-intakes');
      if (!res.ok) throw new Error(`food-intakes: ${res.status}`);
      const data: FoodIntake[] = await res.json();
      setFoodIntakes(sortIntakes(data));
    } catch (e: unknown) {
      console.error('たんぱく質の記録の読込エラー:', e instanceof Error ? e.message : e);
      showMessage({ type: 'error', text: 'たんぱく質の記録の読込に失敗しました。' });
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  const saveFoodIntake = useCallback(
    async (date: string, foodKey: string, quantity: number): Promise<boolean> => {
      try {
        const res = await fetch('/api/food-intakes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, food_key: foodKey, quantity }),
        });
        if (!res.ok) throw new Error(`Save failed: ${res.status}`);
        const saved: FoodIntake = await res.json();
        setFoodIntakes((prev) => sortIntakes([...prev, saved]));
        const label = FOOD_BY_KEY[saved.food_key]?.label ?? saved.food_key;
        showMessage({ type: 'success', text: `${label}（たんぱく質 ${saved.protein_g}g）を記録しました！` });
        return true;
      } catch (err: unknown) {
        console.error('たんぱく質の記録の保存に失敗:', err instanceof Error ? err.message : err);
        showMessage({ type: 'error', text: 'たんぱく質の記録の保存に失敗しました。' });
        return false;
      }
    },
    [showMessage]
  );

  const deleteFoodIntake = useCallback(
    async (id: number) => {
      try {
        const res = await fetch(`/api/food-intakes/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
        setFoodIntakes((prev) => prev.filter((p) => p.id !== id));
      } catch (err: unknown) {
        console.error('たんぱく質の記録の削除に失敗:', err instanceof Error ? err.message : err);
        showMessage({ type: 'error', text: 'たんぱく質の記録の削除に失敗しました。' });
      }
    },
    [showMessage]
  );

  return { foodIntakes, loading, fetchFoodIntakes, saveFoodIntake, deleteFoodIntake };
}
