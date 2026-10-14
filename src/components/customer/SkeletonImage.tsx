'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface SkeletonImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  sizes?: string;
  aspectRatio?: '4/3' | '5/4' | '1/1' | '16/9';
  grayscale?: boolean;
  blurDataURL?: string | null;
  unoptimized?: boolean;
}

const FALLBACK_SRC = '/placeholder-cocktail.svg';

export function SkeletonImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  priority = false,
  sizes = '(max-width: 480px) 100vw, 480px',
  aspectRatio = '4/3',
  grayscale = false,
  blurDataURL,
  unoptimized = true,
}: SkeletonImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const finalSrc = hasError || !src ? FALLBACK_SRC : src;

  const aspectClass =
    aspectRatio === '5/4'
      ? 'aspect-[5/4]'
      : aspectRatio === '1/1'
      ? 'aspect-square'
      : aspectRatio === '16/9'
      ? 'aspect-[16/9]'
      : 'aspect-[4/3]';

  return (
    <div
      className={`relative overflow-hidden bg-[var(--surface-2)] ${aspectClass} ${containerClassName}`}
    >
      {/* Skeleton Shimmer Background before load */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface-2)] via-[rgba(255,255,255,0.03)] to-[var(--surface-2)] animate-pulse z-0" />
      )}

      {/* Main Image */}
      <Image
        src={finalSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        unoptimized={unoptimized}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL || undefined}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        className={`object-cover transition-all duration-700 ease-out ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'
        } ${grayscale ? 'grayscale contrast-75 brightness-75' : ''} ${className}`}
      />
    </div>
  );
}
