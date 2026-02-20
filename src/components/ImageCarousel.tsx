import { useState, useRef, useEffect, useCallback } from 'react';

interface ImageCarouselProps {
  images: string[];
  alt?: string;
}

export default function ImageCarousel({ images, alt = '' }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const isScrollingProgrammatically = useRef(false);

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.children[index] as HTMLElement;
    if (slide) {
      isScrollingProgrammatically.current = true;
      // Use scrollIntoView for better cross-browser RTL support
      slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      // Ensure the flag is cleared after scrolling completes
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 300);
    }
  }, []);

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(index, images.length - 1));
    setCurrentIndex(clamped);
    scrollToIndex(clamped);
  };

  const goPrev = () => {
    const nextIndex = (currentIndex - 1 + images.length) % images.length;
    goTo(nextIndex);
  };
  const goNext = () => {
    const nextIndex = (currentIndex + 1) % images.length;
    goTo(nextIndex);
  };

  // Sync currentIndex when user scrolls manually / swipes
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleScroll = () => {
      // Skip sync if we just programmatically scrolled
      if (isScrollingProgrammatically.current) return;

      const scrollLeft = track.scrollLeft;
      const slideWidth = track.clientWidth;
      // Use absolute value to handle both LTR (positive) and RTL (negative) scroll positions
      const absScrollLeft = Math.abs(scrollLeft);
      const newIndex = Math.round(absScrollLeft / slideWidth);
      const clampedIndex = Math.max(0, Math.min(newIndex, images.length - 1));
      setCurrentIndex(clampedIndex);
    };

    track.addEventListener('scroll', handleScroll, { passive: true });
    return () => track.removeEventListener('scroll', handleScroll);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div className="image-carousel">
      {/* Slides */}
      <div className="carousel-track" ref={trackRef}>
        {images.map((src, i) => (
          <div key={i} className="carousel-slide">
            <img
              src={src}
              alt={`${alt} ${i + 1}`}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            className="carousel-arrow carousel-arrow-prev"
            onClick={goPrev}
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            className="carousel-arrow carousel-arrow-next"
            onClick={goNext}
            aria-label="Next image"
          >
            ›
          </button>

          {/* Dot indicators */}
          <div className="carousel-dots">
            {images.map((_, i) => (
              <button
                key={i}
                className={`carousel-dot ${i === currentIndex ? 'active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>

          {/* Counter */}
          <div className="carousel-counter">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}
