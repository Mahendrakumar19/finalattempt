'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

export interface Testimonial {
  id: string
  name: string
  url: string | null
  testimonial_text: string
  author_name: string | null
  author_role: string | null
}

interface Props {
  testimonials: Testimonial[]
}

export function TestimonialCarousel({ testimonials }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const count = testimonials?.length || 0

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % count)
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + count) % count)
  }

  useEffect(() => {
    if (count <= 1) return

    if (!isHovered) {
      intervalRef.current = setInterval(() => {
        handleNext()
      }, 5000)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [count, isHovered])

  if (!testimonials || count === 0) return null

  // Helper to determine positional layout
  const getCardStyle = (index: number) => {
    if (count === 1) return 'center'
    
    const diff = index - currentIndex
    if (diff === 0) return 'center'
    if (diff === 1 || diff === -(count - 1)) return 'right'
    if (diff === -1 || diff === count - 1) return 'left'
    
    // For arrays larger than 3
    return 'hidden'
  }

  return (
    <div 
      className="w-full max-w-5xl mx-auto px-4 py-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full min-h-[450px] md:min-h-[380px] flex items-center justify-center overflow-hidden py-10">
        
        {testimonials.map((t, index) => {
          const position = getCardStyle(index)
          
          let containerClass = 'absolute w-[90%] max-w-md transition-all duration-700 ease-in-out p-6 md:p-8 rounded-xl shadow-xl flex flex-col justify-between min-h-[320px] h-auto '
          
          if (position === 'center') {
            containerClass += 'z-30 opacity-100 scale-100 md:scale-110 bg-primary text-primary-foreground transform translate-x-0'
          } else if (position === 'left') {
            containerClass += 'z-20 opacity-40 hover:opacity-70 scale-90 md:scale-95 bg-card text-foreground border border-border transform -translate-x-[40%] md:-translate-x-[65%] cursor-pointer'
          } else if (position === 'right') {
            containerClass += 'z-20 opacity-40 hover:opacity-70 scale-90 md:scale-95 bg-card text-foreground border border-border transform translate-x-[40%] md:translate-x-[65%] cursor-pointer'
          } else {
            containerClass += 'z-0 opacity-0 scale-75 bg-card transform translate-x-0 pointer-events-none'
          }

          const isCenter = position === 'center'

          return (
            <div 
              key={t.id} 
              className={containerClass}
              onClick={() => {
                if (position === 'left') handlePrevious()
                if (position === 'right') handleNext()
              }}
            >
              <div>
                <div className="flex items-center gap-2 mb-4 font-bold text-xs tracking-wider uppercase opacity-90">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-4 w-4 ${isCenter ? 'fill-yellow-400 text-yellow-400' : 'fill-primary text-primary'}`} />
                    ))}
                  </div>
                  Trusted Client
                </div>
                <p className={`text-base md:text-lg font-medium italic ${isCenter ? 'text-primary-foreground' : 'text-foreground'}`}>
                  "{t.testimonial_text}"
                </p>
              </div>
              
              <div className={`mt-6 pt-6 border-t ${isCenter ? 'border-primary-foreground/20' : 'border-border'}`}>
                <p className="text-sm font-semibold mb-1">— {t.author_name || 'Customer'}</p>
                <p className={`text-xs ${isCenter ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {t.author_role ? `${t.author_role}, ` : ''} 
                  <span className="font-bold">{t.name}</span>
                </p>
              </div>
            </div>
          )
        })}

      </div>
      
      {/* Controls */}
      {count > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button 
            onClick={handlePrevious}
            className="h-12 w-12 rounded bg-background border border-border shadow-sm flex items-center justify-center text-foreground hover:bg-muted transition-colors active:scale-95"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button 
            onClick={handleNext}
            className="h-12 w-12 rounded bg-background border border-border shadow-sm flex items-center justify-center text-foreground hover:bg-muted transition-colors active:scale-95"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  )
}
