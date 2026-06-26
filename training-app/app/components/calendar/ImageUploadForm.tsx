import React, { useState } from 'react';
import type { ProgressImage, AlertMessage } from '../../types';

interface Props {
  onUpload: (image: ProgressImage) => void;
  showMessage: (msg: AlertMessage) => void;
}

/** 経過画像のアップロードフォーム（撮影日・ファイル・メモ） */
export default function ImageUploadForm({ onUpload, showMessage }: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showMessage({ type: 'error', text: '画像ファイルを選択してください。' });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('date', date);
      formData.append('note', note.trim());

      const res = await fetch('/api/images', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const savedRow: ProgressImage = await res.json();

      onUpload(savedRow);
      setFile(null);
      setDate(new Date().toISOString().slice(0, 10));
      setNote('');
      showMessage({ type: 'success', text: '📷 画像を登録しました。' });
    } catch (err: unknown) {
      console.error('Upload failed:', err instanceof Error ? err.message : err);
      showMessage({ type: 'error', text: '画像登録に失敗しました。' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="element-container">
      <div className="grid-cols-2">
        <div className="element-container">
          <label>撮影日</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="element-container">
          <label>画像ファイル</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </div>
      </div>
      <div className="element-container">
        <label>メモ（任意）</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="撮影条件・体調メモなど"
        />
      </div>
      <button type="submit" disabled={uploading}>
        {uploading ? <span className="spinner"></span> : '📤'} 画像を登録する
      </button>
    </form>
  );
}
