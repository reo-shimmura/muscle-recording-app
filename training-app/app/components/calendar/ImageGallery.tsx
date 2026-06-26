import type { ProgressImage } from '../../types';

interface Props {
  images: ProgressImage[];
}

/** 登録済み経過画像の一覧表示 */
export default function ImageGallery({ images }: Props) {
  if (images.length === 0) return null;

  return (
    <div className="element-container" style={{ marginTop: '1rem' }}>
      <h4>登録済み画像</h4>
      <div className="grid-cols-2">
        {images.map((img) => (
          <div key={img.id ?? `${img.date}-${img.image_path}`} className="record-item">
            <div className="record-item-meta" style={{ marginBottom: '0.5rem' }}>{img.date}</div>
            <div className="image-container">
              <img src={img.image_path} alt={`記録画像-${img.date}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
