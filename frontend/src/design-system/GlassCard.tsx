import React from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  isSample?: boolean;
  sampleLabel?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  isSample = false,
  sampleLabel = 'Sample',
  padding = 'md',
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

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-xl)',
        padding: paddingStyles[padding],
        backgroundColor: 'rgba(250, 249, 245, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.65)',
        boxShadow: 'var(--shadow-card-float)',
        color: 'var(--color-ink)',
        ...style,
      }}
      className={`tara-glass-card ${className}`}
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
            backgroundColor: 'rgba(21, 22, 21, 0.08)',
            color: 'var(--color-ink-soft)',
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
