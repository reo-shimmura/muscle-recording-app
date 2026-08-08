'use client'

import { useState, useCallback } from 'react';
import type { TrainingRecord, AlertMessage } from '../types';

interface UseTrainingDataReturn {
  records: TrainingRecord[];
  loading: boolean;
  setRecords: React.Dispatch<React.SetStateAction<TrainingRecord[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  fetchData: () => Promise<void>;
}

export function useTrainingData(
  showMessage: (msg: AlertMessage) => void
): UseTrainingDataReturn {
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const recRes = await fetch('/api/records');
      if (!recRes.ok) throw new Error(`records: ${recRes.status}`);

      const recs: TrainingRecord[] = await recRes.json();
      setRecords(recs);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '不明なエラーが発生しました。';
      console.error('データ読込エラー:', msg);
      showMessage({ type: 'error', text: 'データの読込に失敗しました。' });
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  return { records, loading, setRecords, setLoading, fetchData };
}
