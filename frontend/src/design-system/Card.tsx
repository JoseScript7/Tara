import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'panel' | 'coral' | 'dark' | 'outlined';
  isSample?: boolean;
  sampleLabel?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevation?: 'flat' | 'raised' | 'floating';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'panel',
  isSample = false,
  sampleLabel = 'Sample',
  padding = 'md',
  elevation = 'raised',
  children,
  className = '',
  style,
  ...props
}) => {
  const paddingStyles: Record<string, string> = {
    none: '0',
    sm: 'var(--space-3)',
    md: 'var(--space-5)',
    lg: 'var(--space-8)',
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'coral':
        return {
          backgroundColor: 'var(--color-coral)',
          color: 'var(--color-ink)', // High contrast 7.85:1
          border: '1px solid rgba(21, 22, 21, 0.08)',
        };
      case 'dark':
        return {
          backgroundColor: 'var(--color-dark-card)',
          color: 'var(--color-dark-card-text)', // 12.91:1
          border: '1px solid rgba(255, 255, 255, 0.1)',
        };
      case 'outlined':
        return {
          backgroundColor: 'var(--color-panel)',
          color: 'var(--color-ink)',
          border: '1px solid var(--color-panel-border)',
        };
      case 'panel':
      default:
        return {
          backgroundColor: 'var(--color-panel)',
          color: 'var(--color-ink)',
          border: '1px solid var(--color-panel-border)',
        };
    }
  };

  const getElevationShadow = (): string => {
    switch (elevation) {
      case 'floating':
        return 'var(--shadow-card-float)';
      case 'raised':
        return 'var(--shadow-md)';
      case 'flat':
      default:
        return 'none';
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-xl)',
        padding: paddingStyles[padding],
        boxShadow: getElevationShadow(),
        transition: 'transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        ...getVariantStyles(),
        ...style,
      }}
      className={`tara-card tara-card-${variant} ${className}`}
      {...props}
    >
      {isSample && (
        <span
          style={{
            position: 'absolute',
            top: '0.625rem',
            right: '0.75rem',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-semibold)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            padding: '0.125rem 0.5rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: variant === 'dark' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(21, 22, 21, 0.08)',
            color: variant === 'dark' ? '#FAF9F5' : 'var(--color-ink-soft)',
            pointerEvents: 'none',
          }}
          aria-label="Sample preview data"
        >
          {sampleLabel}
        </span>
      )}
      {children}
    </div>
  );
};
