'use client'

import { useState } from 'react';

/** ビフォーアフター画像比較（ローカルファイルを左右に並べて表示） */
export default function ImageCompare() {
  const [left, setLeft] = useState<string | null>(null);
  const [right, setRight] = useState<string | null>(null);

  const handleFileLoad = (file: File, callback: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid-cols-2">
      <div className="element-container">
        <label>Before 画像を選択</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileLoad(e.target.files[0], setLeft);
          }}
        />
        {left && (
          <div className="image-container" style={{ marginTop: '1rem' }}>
            <img src={left} alt="Before" />
          </div>
        )}
      </div>
      <div className="element-container">
        <label>After 画像を選択</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileLoad(e.target.files[0], setRight);
          }}
        />
        {right && (
          <div className="image-container" style={{ marginTop: '1rem' }}>
            <img src={right} alt="After" />
          </div>
        )}
      </div>
    </div>
  );
}
