import { useState, useRef, useCallback } from 'react';
import ImageCarousel from './ImageCarousel';

interface ImageGalleryProps {
  images: string[];
  alt?: string;
  displayMode?: 'gallery' | 'carousel';
  zoomable?: boolean;
}

export default function ImageGallery({ images, alt = '', displayMode = 'gallery', zoomable = false }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffset = useRef({ x: 0, y: 0 });

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    panOffset.current = { x: 0, y: 0 };
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!zoomable) return;
    e.preventDefault();
    e.stopPropagation();
    setZoom(prev => Math.min(Math.max(prev - e.deltaY * 0.002, 1), 6));
  }, [zoomable]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!zoomable || zoom <= 1) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX - panOffset.current.x, y: e.clientY - panOffset.current.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [zoomable, zoom]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current) return;
    const newX = e.clientX - panStart.current.x;
    const newY = e.clientY - panStart.current.y;
    panOffset.current = { x: newX, y: newY };
    setPan({ x: newX, y: newY });
  }, []);

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  if (images.length === 0) return null;

  if (displayMode === 'carousel') {
    return <ImageCarousel images={images} alt={alt} />;
  }

  const openLightbox = (i: number) => {
    resetZoom();
    setSelectedIndex(i);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
    resetZoom();
  };

  return (
    <>
      <div className="image-gallery">
        {images.map((src, i) => (
          <div key={i} className="gallery-item" onClick={() => openLightbox(i)}>
            <img src={src} alt={`${alt} ${i + 1}`} loading="lazy" />
          </div>
        ))}
      </div>

      {selectedIndex !== null && (
        <div className="lightbox" onClick={closeLightbox}>
          <div className={`lightbox-content ${zoomable ? 'lightbox-zoomable' : ''}`} onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>
              ✕
            </button>
            {zoomable && (
              <div className="lightbox-zoom-controls">
                <button onClick={() => setZoom(prev => Math.min(prev + 0.5, 6))}>+</button>
                <span>{Math.round(zoom * 100)}%</span>
                <button onClick={() => { setZoom(prev => Math.max(prev - 0.5, 1)); if (zoom <= 1.5) resetZoom(); }}>−</button>
                {zoom > 1 && <button onClick={resetZoom}>↺</button>}
              </div>
            )}
            <div
              className="lightbox-image-wrapper"
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{ cursor: zoomable ? (zoom > 1 ? 'grab' : 'zoom-in') : 'default' }}
            >
              <img
                src={images[selectedIndex]}
                alt={`${alt} ${selectedIndex + 1}`}
                style={zoomable ? {
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transition: isPanning.current ? 'none' : 'transform 0.2s ease',
                } : undefined}
                draggable={false}
              />
            </div>
            <div className="lightbox-nav">
              <button
                onClick={() => {
                  resetZoom();
                  setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
                }}
              >
                ‹
              </button>
              <span>
                {selectedIndex + 1} / {images.length}
              </span>
              <button
                onClick={() => {
                  resetZoom();
                  setSelectedIndex((selectedIndex + 1) % images.length);
                }}
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
