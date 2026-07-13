'use client'

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import CalendarGrid from './CalendarGrid';
import ImageUploadForm from './ImageUploadForm';
import ImageGallery from './ImageGallery';
import ImageCompare from './ImageCompare';
import type { TrainingRecord, ProgressImage, AlertMessage } from '../../types';

interface Props {
  records: TrainingRecord[];
  images: ProgressImage[];
  onImageUpload: (image: ProgressImage) => void;
  showMessage: (msg: AlertMessage) => void;
}

/** カレンダータブ：月次表示・日付別記録・画像登録・比較を一元管理 */
export default function CalendarTab({ records, images, onImageUpload, showMessage }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const selectedRecords = selectedDate ? records.filter((r) => r.date === selectedDate) : [];

  return (
    <div>
      <h3>📅 トレーニングカレンダー</h3>
      <CalendarGrid
        records={records}
        currentMonth={currentMonth}
        currentYear={currentYear}
        selectedDate={selectedDate}
        onMonthChange={(month, year) => {
          setCurrentMonth(month);
          setCurrentYear(year);
        }}
        onDateSelect={setSelectedDate}
      />

      {selectedDate && (
        <div className="element-container" style={{ marginTop: '2rem' }}>
          <h4>📋 {selectedDate} のトレーニング内容</h4>
          {selectedRecords.length === 0 ? (
            <div className="small-muted">この日のトレーニング記録はありません。</div>
          ) : (
            <div>
              {selectedRecords.map((r) => (
                <Card key={r.id} className="mb-3 border-l-4 border-l-primary">
                  <CardContent>
                    <div className="record-item-title">{r.exercise}</div>
                    <div className="record-item-meta">
                      {r.duration_minutes != null
                        ? `${r.duration_minutes}分`
                        : `${r.weight}kg × ${r.reps}回 × ${r.sets}セット`}
                    </div>
                    {r.memo && <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>{r.memo}</div>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <hr />
      <h4>画像登録</h4>
      <ImageUploadForm onUpload={onImageUpload} showMessage={showMessage} />
      <ImageGallery images={images} />

      <h4>画像比較（ビフォーアフター）</h4>
      <ImageCompare />
    </div>
  );
}
