"use client"

import { useState } from "react"

interface FeatureImageProps {
  src: string
  alt: string
}

export function FeatureImage({ src, alt }: FeatureImageProps) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (error) {
    return null
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ${loaded ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
    />
  )
}
