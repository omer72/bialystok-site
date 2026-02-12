import { useState } from 'react';
import ImageCarousel from './ImageCarousel';

interface ImageGalleryProps {
  images: string[];
  alt?: string;
  displayMode?: 'gallery' | 'carousel';
}

export default function ImageGallery({ images, alt = '', displayMode = 'gallery' }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  if (displayMode === 'carousel') {
    return <ImageCarousel images={images} alt={alt} />;
  }

  return (
    <>
      <div className="image-gallery">
        {images.map((src, i) => (
          <div key={i} className="gallery-item" onClick={() => setSelectedIndex(i)}>
            <img src={src} alt={`${alt} ${i + 1}`} loading="lazy" />
          </div>
        ))}
      </div>

      {selectedIndex !== null && (
        <div className="lightbox" onClick={() => setSelectedIndex(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelectedIndex(null)}>
              ✕
            </button>
            <img src={images[selectedIndex]} alt={`${alt} ${selectedIndex + 1}`} />
            <div className="lightbox-nav">
              <button
                onClick={() =>
                  setSelectedIndex((selectedIndex - 1 + images.length) % images.length)
                }
              >
                ‹
              </button>
              <span>
                {selectedIndex + 1} / {images.length}
              </span>
              <button
                onClick={() => setSelectedIndex((selectedIndex + 1) % images.length)}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
