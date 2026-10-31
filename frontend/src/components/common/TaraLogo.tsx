import React from 'react';

interface TaraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showSubtitle?: boolean;
  badgeText?: string;
  className?: string;
}

export const TaraLogo: React.FC<TaraLogoProps> = ({ 
  size = 'md', 
  showSubtitle = true, 
  badgeText = 'PRO',
  className = '' 
}) => {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    hero: 'w-14 h-14'
  }[size];

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base font-bold',
    lg: 'text-xl font-bold',
    hero: 'text-3xl font-bold'
  }[size];

  const badgeSizes = {
    sm: 'text-[8px] px-1.5 py-0.2',
    md: 'text-[9px] px-2 py-0.5',
    lg: 'text-[11px] px-2.5 py-0.5',
    hero: 'text-xs px-3 py-1'
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Engineered Tara Squircle Emblem with Glowing Sparkle & Dot */}
      <div className={`relative ${iconDimensions} shrink-0`}>
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Obsidian Squircle Container */}
          <rect 
            x="2" y="2" width="96" height="96" rx="28" 
            fill="#05080E" 
          />
          <rect 
            x="2" y="2" width="96" height="96" rx="28" 
            stroke="rgba(255,255,255,0.08)" 
            strokeWidth="1.5" 
          />

          {/* Glowing Mint / Teal 4-Point Star (Sparkle) */}
          <path 
            d="M 52 18 C 52 35, 65 48, 82 48 C 65 48, 52 61, 52 78 C 52 61, 39 48, 22 48 C 39 48, 52 35, 52 18 Z" 
            stroke="#00E599" 
            strokeWidth="6.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none" 
          />

          {/* Ambient Intelligence Accent Dot at bottom-left */}
          <circle cx="28" cy="72" r="6" fill="#00E599" />
        </svg>
      </div>

      {/* Brand Typography & PRO Badge */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`tracking-tight text-neutral-900 font-sans ${titleSizes}`}>
            Tara
          </span>
          <span className={`font-bold tracking-wider rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 uppercase ${badgeSizes}`}>
            {badgeText}
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] font-medium text-neutral-400 mt-0.5">
            Merchant Teammate
          </span>
        )}
      </div>
    </div>
  );
};
