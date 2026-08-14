'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TOPPER_POSTERS = [
  { id: '1', title: 'BPSC Topper Selection 1', url: '/MD-FA.jpg' },
  { id: '2', title: 'BPSC Topper Selection 2', url: '/JP-FA.jpg' },
  { id: '3', title: 'BPSC Topper Selection 3', url: '/SP-FA.jpg' },
  { id: '4', title: 'BPSC Topper Selection 4', url: '/SU-FA.jpg' }
];

interface ImageDimensions {
  width: number;
  height: number;
}

export default function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Dynamic dimensions mapping by topper id
  const [imageDims, setImageDims] = useState<Record<string, ImageDimensions>>({});

  const minSwipeDistance = 50;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % TOPPER_POSTERS.length);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + TOPPER_POSTERS.length) % TOPPER_POSTERS.length);
  }, []);

  // Autoplay (6s interval)
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(handleNext, 6000);
    return () => clearInterval(interval);
  }, [isHovered, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Touch Swipe Support
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) handleNext();
    if (distance < -minSwipeDistance) handlePrev();
  };

  // Calculate dynamic wrapper height depending on the current active image's aspect ratio
  const activeDims = imageDims[TOPPER_POSTERS[currentIndex].id];
  const activeRatio = activeDims ? activeDims.width / activeDims.height : 2.08;
  
  // Height = Width / AspectRatio. Assuming max-width on desktop is ~640px.
  // We use this to scale wrapper height dynamically.
  const wrapperHeightStyle = {
    height: `calc(min(90vw, 640px) / ${activeRatio} + 40px)`
  };

  return (
    <div
      className="relative w-full overflow-hidden py-4 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Slide Deck Wrapper with dynamic height */}
      <div 
        className="max-w-4xl mx-auto px-4 md:px-12 relative flex justify-center items-center transition-all duration-500"
        style={wrapperHeightStyle}
      >
        {TOPPER_POSTERS.map((topper, idx) => {
          const isCenter = idx === currentIndex;
          const isLeft = idx === (currentIndex - 1 + TOPPER_POSTERS.length) % TOPPER_POSTERS.length;
          const isRight = idx === (currentIndex + 1) % TOPPER_POSTERS.length;
          const isVisible = isCenter || isLeft || isRight;

          if (!isVisible) return null;

          // Compute deck coordinates
          let offsetClass = 'translate-x-0';
          if (isLeft) offsetClass = '-translate-x-[45%] md:-translate-x-[50%] scale-[0.82] opacity-35 z-10';
          if (isRight) offsetClass = 'translate-x-[45%] md:translate-x-[50%] scale-[0.82] opacity-35 z-10';
          if (isCenter) offsetClass = 'translate-x-0 scale-100 opacity-100 z-20 glow-premium border-amber-500/20';

          const dims = imageDims[topper.id];
          const ratioStyle = dims ? { aspectRatio: `${dims.width} / ${dims.height}` } : { aspectRatio: '1010/485' };

          return (
            <div
              key={topper.id}
              className={`absolute w-full max-w-[280px] md:max-w-[640px] bg-[#0F172A] border border-slate-100 dark:border-white/[0.04] rounded-2xl md:rounded-3xl overflow-hidden shadow-md transition-all duration-500 ease-out ${offsetClass}`}
              style={ratioStyle}
            >
              <img
                src={topper.url}
                alt={topper.title}
                className="w-full h-full object-cover pointer-events-none select-none"
                loading="lazy"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setImageDims((prev) => ({
                    ...prev,
                    [topper.id]: { width: img.naturalWidth, height: img.naturalHeight }
                  }));
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Navigation Indicators */}
      <div className="flex justify-center items-center gap-6 mt-6">
        <button
          onClick={handlePrev}
          className="p-2.5 border border-slate-100 dark:border-white/[0.06] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-amber-500 text-slate-400 cursor-pointer transition-colors"
          aria-label="Previous topper"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex gap-2">
          {TOPPER_POSTERS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-5 bg-amber-500' : 'w-2 bg-slate-200 dark:bg-slate-800'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="p-2.5 border border-slate-100 dark:border-white/[0.06] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-amber-500 text-slate-400 cursor-pointer transition-colors"
          aria-label="Next topper"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
