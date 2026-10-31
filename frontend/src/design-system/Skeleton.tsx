import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  borderRadius,
  className = '',
  style,
  ...props
}) => {
  const getDefaultStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'circular':
        return {
          width: width || '40px',
          height: height || '40px',
          borderRadius: '50%',
        };
      case 'rectangular':
        return {
          width: width || '100%',
          height: height || '120px',
          borderRadius: borderRadius || 'var(--radius-md)',
        };
      case 'text':
      default:
        return {
          width: width || '100%',
          height: height || '1rem',
          borderRadius: borderRadius || 'var(--radius-xs)',
          margin: '0.25rem 0',
        };
    }
  };

  return (
    <div
      aria-busy="true"
      aria-label="Loading content"
      style={{
        backgroundColor: 'rgba(21, 22, 21, 0.08)',
        backgroundImage:
          'linear-gradient(90deg, rgba(21, 22, 21, 0.04) 0%, rgba(21, 22, 21, 0.09) 50%, rgba(21, 22, 21, 0.04) 100%)',
        backgroundSize: '200% 100%',
        animation: 'tara-shimmer 1.5s infinite linear',
        ...getDefaultStyles(),
        ...style,
      }}
      className={`tara-skeleton ${className}`}
      {...props}
    />
  );
};
