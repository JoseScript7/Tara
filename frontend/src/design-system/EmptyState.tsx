import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-6)',
        textAlign: 'center',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--color-panel)',
        border: '1px dashed var(--color-panel-border)',
        ...style,
      }}
      className={`tara-empty-state ${className}`}
    >
      {icon && (
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-chip)',
            color: 'var(--color-ink-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-4)',
          }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <h3
        style={{
          margin: '0 0 var(--space-2) 0',
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--color-ink)',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: '0 0 var(--space-6) 0',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-ink-soft)',
          maxWidth: '400px',
          lineHeight: 'var(--leading-normal)',
        }}
      >
        {description}
      </p>

      {(action || secondaryAction) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};
