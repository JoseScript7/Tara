import React, { useEffect, useState, useRef } from 'react';
import assetManifest from './assetManifest.json';

export type AssetId = 'IMG-1' | 'IMG-2' | 'IMG-3' | 'IMG-4' | 'IMG-5' | 'IMG-6';

export interface ResponsiveMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  assetId: AssetId;
  alt?: string;
  priority?: boolean;
  withVideo?: boolean;
  aspectRatio?: string;
  sizes?: string;
  objectFit?: 'cover' | 'contain' | 'scale-down';
}

interface NetworkInformation extends EventTarget {
  saveData?: boolean;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

export const ResponsiveMedia: React.FC<ResponsiveMediaProps> = ({
  assetId,
  alt: customAlt,
  priority = false,
  withVideo = false,
  aspectRatio: customAspectRatio,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px',
  objectFit = 'cover',
  className = '',
  style,
  ...props
}) => {
  const asset = (assetManifest.assets as Record<string, any>)[assetId];
  const videoSpec = (assetManifest.videoLoops as Record<string, any>)['HERO_LOOP'];

  const alt = customAlt || asset?.alt || '';
  if (!alt && import.meta.env?.DEV) {
    console.warn(`[ResponsiveMedia] Accessibility Warning: Missing alt text for asset ${assetId}`);
  }

  // Calculate aspect ratio string (e.g. "2/3" or "16/9")
  const aspectRatio = customAspectRatio || asset?.aspectRatio?.replace(':', '/') || '16/9';

  // Network & Motion Preferences
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!withVideo || !videoSpec) {
      setShouldPlayVideo(false);
      return;
    }

    // 1. Check prefers-reduced-motion
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotionQuery.matches) {
      setShouldPlayVideo(false);
      return;
    }

    // 2. Check Network Information API (saveData / slow connection)
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      if (conn.saveData === true || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
        console.info('[ResponsiveMedia] Data-Saver / slow network active; skipping video autoplay.');
        setShouldPlayVideo(false);
        return;
      }
    }

    setShouldPlayVideo(true);
  }, [withVideo, videoSpec]);

  // Preload hero asset in head if priority is true
  useEffect(() => {
    if (priority && asset?.avif?.['800']) {
      const linkId = `preload-asset-${assetId}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'preload';
        link.as = 'image';
        link.href = asset.avif['800'];
        link.type = 'image/avif';
        document.head.appendChild(link);
      }
    }
  }, [priority, asset, assetId]);

  // Build srcset strings
  const avifSrcSet = asset?.avif
    ? Object.entries(asset.avif)
        .map(([w, src]) => `${src} ${w}w`)
        .join(', ')
    : '';

  const webpSrcSet = asset?.webp
    ? Object.entries(asset.webp)
        .map(([w, src]) => `${src} ${w}w`)
        .join(', ')
    : '';

  const fallbackSrc = asset?.fallback || `/assets/optimized/${asset?.slug}-800.webp`;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio,
        overflow: 'hidden',
        backgroundColor: 'var(--color-ground)',
        borderRadius: 'inherit',
        ...style,
      }}
      className={`tara-responsive-media ${className}`}
      {...props}
    >
      {/* Base Still Image (Preloaded & Resilient) */}
      <picture>
        {avifSrcSet && <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />}
        {webpSrcSet && <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />}
        <img
          src={fallbackSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            display: 'block',
            transition: 'opacity var(--duration-fast) var(--ease-out)',
          }}
        />
      </picture>

      {/* Video Loop Overlay (Only if permitted and ready) */}
      {withVideo && shouldPlayVideo && videoSpec && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster={videoSpec.poster}
          onCanPlay={() => setVideoLoaded(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit,
            opacity: videoLoaded ? 1 : 0,
            transition: 'opacity var(--duration-normal) var(--ease-out)',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          {videoSpec.webm && <source src={videoSpec.webm} type="video/webm" />}
          {videoSpec.mp4 && <source src={videoSpec.mp4} type="video/mp4" />}
        </video>
      )}
    </div>
  );
};
