'use client'

import { useState, useCallback } from 'react';
import type { TrainingRecord, ProgressImage, AlertMessage } from '../types';

interface UseTrainingDataReturn {
  records: TrainingRecord[];
  images: ProgressImage[];
  loading: boolean;
  setRecords: React.Dispatch<React.SetStateAction<TrainingRecord[]>>;
  setImages: React.Dispatch<React.SetStateAction<ProgressImage[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  fetchData: () => Promise<void>;
}

export function useTrainingData(
  showMessage: (msg: AlertMessage) => void
): UseTrainingDataReturn {
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [images, setImages] = useState<ProgressImage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [recRes, imgRes] = await Promise.all([
        fetch('/api/records'),
        fetch('/api/images'),
      ]);

      if (!recRes.ok) throw new Error(`records: ${recRes.status}`);
      if (!imgRes.ok) throw new Error(`images: ${imgRes.status}`);

      const recs: TrainingRecord[] = await recRes.json();
      const imageRows: ProgressImage[] = await imgRes.json();

      setRecords(recs);
      setImages(imageRows);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '不明なエラーが発生しました。';
      console.error('データ読込エラー:', msg);
      showMessage({ type: 'error', text: 'データの読込に失敗しました。' });
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  return { records, images, loading, setRecords, setImages, setLoading, fetchData };
}
