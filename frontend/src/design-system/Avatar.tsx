import React from 'react';

export type MascotState = 'idle' | 'listening' | 'thinking' | 'working' | 'needs-merchant';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  state?: MascotState;
  showBadge?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  size = 'md',
  state = 'idle',
  showBadge = false,
  className = '',
  style,
  ...props
}) => {
  const sizeMap: Record<string, { px: number; eyeR: number; pupilR: number }> = {
    xs: { px: 24, eyeR: 3, pupilR: 1.5 },
    sm: { px: 32, eyeR: 4, pupilR: 2 },
    md: { px: 40, eyeR: 5, pupilR: 2.5 },
    lg: { px: 56, eyeR: 7, pupilR: 3.5 },
    xl: { px: 72, eyeR: 9, pupilR: 4.5 },
  };

  const { px } = sizeMap[size] || sizeMap.md;

  // Pupil offsets based on state
  const getPupilOffset = () => {
    switch (state) {
      case 'listening':
        return { x: 0, y: -1.5, irisColor: '#FA7F62' };
      case 'thinking':
        return { x: 2, y: -2, irisColor: '#6B4700' };
      case 'working':
        return { x: 0, y: 1.5, irisColor: '#145A19' };
      case 'needs-merchant':
        return { x: 0, y: 0, irisColor: '#D95436' };
      case 'idle':
      default:
        return { x: 0, y: 0, irisColor: '#FA7F62' };
    }
  };

  const pupil = getPupilOffset();

  return (
    <div
      role="img"
      aria-label={`Tara AI Teammate (${state} state)`}
      style={{
        position: 'relative',
        width: `${px}px`,
        height: `${px}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        backgroundColor: 'var(--color-panel)',
        boxShadow: 'var(--shadow-sm)',
        border: '1.5px solid var(--color-dark-card)',
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
      className={`tara-avatar tara-avatar-${state} ${className}`}
      {...props}
    >
      <svg
        viewBox="0 0 100 100"
        width="82%"
        height="82%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Mascot Face Body */}
        <rect
          x="12"
          y="18"
          width="76"
          height="64"
          rx="22"
          fill="#FAF9F5"
          stroke="#2C3426"
          strokeWidth="6"
        />

        {/* Small Antenna / Top Node */}
        <line x1="50" y1="6" x2="50" y2="18" stroke="#2C3426" strokeWidth="5" strokeLinecap="round" />
        <circle cx="50" cy="6" r="4.5" fill="#FA7F62" />

        {/* Ears */}
        <rect x="4" y="42" width="8" height="16" rx="4" fill="#2C3426" />
        <rect x="88" y="42" width="8" height="16" rx="4" fill="#2C3426" />

        {/* Cheeks */}
        <circle cx="26" cy="62" r="5" fill="#FE8A70" opacity="0.6" />
        <circle cx="74" cy="62" r="5" fill="#FE8A70" opacity="0.6" />

        {/* Left Eye Socket */}
        <circle cx="34" cy="46" r="11" fill="#151615" />
        {/* Left Iris & Pupil */}
        <circle
          cx={34 + pupil.x}
          cy={46 + pupil.y}
          r="6"
          fill={pupil.irisColor}
          className="tara-pupil"
        />
        <circle cx={34 + pupil.x - 1.5} cy={46 + pupil.y - 1.5} r="2" fill="#FFFFFF" />

        {/* Right Eye Socket */}
        <circle cx="66" cy="46" r="11" fill="#151615" />
        {/* Right Iris & Pupil */}
        <circle
          cx={66 + pupil.x}
          cy={46 + pupil.y}
          r="6"
          fill={pupil.irisColor}
          className="tara-pupil"
        />
        <circle cx={66 + pupil.x - 1.5} cy={46 + pupil.y - 1.5} r="2" fill="#FFFFFF" />

        {/* Mouth Indicator */}
        {state === 'needs-merchant' ? (
          <ellipse cx="50" cy="67" rx="6" ry="4" fill="#2C3426" />
        ) : state === 'listening' ? (
          <path d="M42 66 Q50 72 58 66" stroke="#2C3426" strokeWidth="3" strokeLinecap="round" />
        ) : (
          <path d="M44 67 Q50 71 56 67" stroke="#2C3426" strokeWidth="3" strokeLinecap="round" />
        )}
      </svg>

      {/* Online / Active Badge Indicator */}
      {showBadge && (
        <span
          style={{
            position: 'absolute',
            bottom: '-1px',
            right: '-1px',
            width: `${Math.max(8, px * 0.28)}px`,
            height: `${Math.max(8, px * 0.28)}px`,
            borderRadius: '50%',
            backgroundColor:
              state === 'needs-merchant'
                ? 'var(--status-warn-text)'
                : 'var(--status-ok-text)',
            border: '2px solid #FAF9F5',
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
