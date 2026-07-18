'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote, Award, MapPin } from 'lucide-react';
import { db, ResultTopper } from '@/services/db';

export default function TestimonialCarousel() {
  const [toppers, setToppers] = useState<ResultTopper[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance in pixels
  const minSwipeDistance = 50;

  useEffect(() => {
    async function loadToppers() {
      try {
        const res = await db.getResults();
        if (res && res.length > 0) {
          setToppers(res);
        } else {
          // Hardcoded fallbacks if API is unreachable
          setToppers([
            {
              id: '1',
              name: 'Aditya Raj',
              rank: 'Rank 12, 67th BPSC (SDM)',
              exam: 'BPSC 67th',
              course: 'BPSC Foundation Batch',
              service: 'Bihar Administrative Service (BAS)',
              district: 'Patna',
              photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
              year: 2023,
              story: 'The personalized micro-scheduling at Final Attempt kept me accountable. The daily mains answer evaluation from selected officers gave me the exact confidence I needed to clear SDM.'
            },
            {
              id: '2',
              name: 'Neha Shrivastava',
              rank: 'Rank 28, 68th BPSC (DSP)',
              exam: 'BPSC 68th',
              course: 'BPSC Prelims Test Series',
              service: 'Bihar Police Service (BPS)',
              district: 'Muzaffarpur',
              photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
              year: 2024,
              story: 'Their Prelims test series matches BPSC syllabus depth closely. The micro-analytics diagnostic maps helped me isolate weak themes and convert them into scoring areas.'
            },
            {
              id: '3',
              name: 'Vikash Kumar',
              rank: 'Rank 45, 67th BPSC (BDO)',
              exam: 'BPSC 67th',
              course: 'Mains Answer Writing',
              service: 'Bihar Rural Development Service',
              district: 'Gaya',
              photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
              year: 2023,
              story: 'Final Attempt provides a highly focused study ecosystem in Patna. Siddharth Sir\'s direct mentoring on Answer writing structure is highly analytical and unmatched.'
            },
            {
              id: '4',
              name: 'Siddharth Anand',
              rank: 'Rank 52, 68th BPSC (CTO)',
              exam: 'BPSC 68th',
              course: 'Interview Guidance Program',
              service: 'Commercial Taxes Officer',
              district: 'Bhagalpur',
              photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
              year: 2024,
              story: 'The mock interviews felt incredibly realistic. The panel pointed out micro-mannerisms and structure tweaks that helped me score maximum marks in the BPSC interview.'
            }
          ]);
        }
      } catch (err) {
        console.error('Failed loading testimonials:', err);
      }
    }
    loadToppers();
  }, []);

  const handleNext = useCallback(() => {
    if (toppers.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % toppers.length);
  }, [toppers]);

  const handlePrev = useCallback(() => {
    if (toppers.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + toppers.length) % toppers.length);
  }, [toppers]);

  // Autoplay functionality (5-7 seconds interval)
  useEffect(() => {
    if (isHovered || toppers.length === 0) return;
    const interval = setInterval(handleNext, 6000);
    return () => clearInterval(interval);
  }, [isHovered, toppers, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Touch handlers for swipe support
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
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  if (toppers.length === 0) return null;

  // Helper to calculate responsive visible card classes
  const getCardPositionClass = (idx: number) => {
    const total = toppers.length;
    // Calculate index relative to current
    const relativeIndex = (idx - currentIndex + total) % total;

    if (relativeIndex === 0) {
      // Center card
      return 'scale-100 opacity-100 z-30 glow-premium border-amber-500/30';
    } else if (relativeIndex === 1 || relativeIndex === total - 1) {
      // Side cards
      return 'scale-95 opacity-60 z-20 pointer-events-none md:pointer-events-auto';
    } else {
      // Offscreen
      return 'scale-90 opacity-0 z-10 pointer-events-none hidden lg:block';
    }
  };

  // Get current active 3 cards for desktop rendering layout
  const visibleIndices = [
    (currentIndex - 1 + toppers.length) % toppers.length,
    currentIndex,
    (currentIndex + 1) % toppers.length
  ];

  return (
    <div
      className="relative w-full overflow-hidden py-6"
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Testimonials Deck Container */}
      <div className="max-w-6xl mx-auto px-4 md:px-12 relative flex justify-center items-center h-[340px] md:h-[300px]">
        {toppers.map((topper, idx) => {
          const isCenter = idx === currentIndex;
          const isLeft = idx === (currentIndex - 1 + toppers.length) % toppers.length;
          const isRight = idx === (currentIndex + 1) % toppers.length;
          const isVisible = isCenter || isLeft || isRight;

          if (!isVisible) return null;

          // Determine slide offset class for premium desktop deck transition
          let offsetClass = 'translate-x-0';
          if (isLeft) offsetClass = '-translate-x-2/3 md:-translate-x-3/4 scale-[0.88] opacity-40 z-10';
          if (isRight) offsetClass = 'translate-x-2/3 md:translate-x-3/4 scale-[0.88] opacity-40 z-10';
          if (isCenter) offsetClass = 'translate-x-0 scale-100 opacity-100 z-20 glow-premium border-amber-500/20';

          return (
            <div
              key={topper.id}
              className={`absolute w-full max-w-[340px] md:max-w-[420px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/[0.04] p-6 rounded-3xl transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col justify-between h-[280px] select-none ${offsetClass}`}
            >
              <div className="space-y-3">
                {/* Quote header */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <Quote className="w-5 h-5 text-slate-200 dark:text-slate-800" />
                </div>
                
                <p className="text-[11px] md:text-xs text-slate-650 dark:text-slate-350 leading-relaxed italic line-clamp-4">
                  "{topper.story}"
                </p>
              </div>

              {/* Topper Meta */}
              <div className="flex items-center gap-3.5 border-t border-slate-50 dark:border-white/[0.02] pt-4 mt-2">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-50 dark:bg-slate-950 shrink-0 border border-slate-100 dark:border-white/[0.08]">
                  <img src={topper.photo} alt={topper.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-heading font-black text-xs text-slate-950 dark:text-white truncate">{topper.name}</h4>
                  <div className="flex items-center gap-1 mt-0.5 truncate text-[9px] font-bold text-amber-600 dark:text-amber-400">
                    <Award className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="truncate">{topper.rank}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-[8px] text-slate-400 dark:text-slate-500 font-bold truncate">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    <span>District: {topper.district} &bull; {topper.course}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Controls & Indicator Dots */}
      <div className="flex justify-center items-center gap-6 mt-4">
        <button
          onClick={handlePrev}
          className="p-2 border border-slate-100 dark:border-white/[0.06] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-amber-500 text-slate-400 cursor-pointer transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Indicator dots */}
        <div className="flex gap-1.5">
          {toppers.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-5 bg-amber-500' : 'w-2 bg-slate-200 dark:bg-slate-850'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="p-2 border border-slate-100 dark:border-white/[0.06] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-amber-500 text-slate-400 cursor-pointer transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
