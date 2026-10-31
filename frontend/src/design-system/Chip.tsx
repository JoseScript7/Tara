import React from 'react';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  active?: boolean;
  clickable?: boolean;
  icon?: React.ReactNode;
  onRemove?: () => void;
  children: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  active = false,
  clickable = false,
  icon,
  onRemove,
  children,
  className = '',
  style,
  onClick,
  ...props
}) => {
  return (
    <span
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.(e as unknown as React.MouseEvent<HTMLSpanElement>);
              }
            }
          : undefined
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.25rem 0.75rem',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-medium)',
        lineHeight: '1.4',
        backgroundColor: active ? 'var(--color-ink)' : 'var(--color-chip)',
        color: active ? '#FAF9F5' : 'var(--color-ink)',
        border: `1px solid ${active ? 'var(--color-ink)' : 'var(--color-chip-border)'}`,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'all var(--duration-fast) var(--ease-out)',
        userSelect: 'none',
        ...style,
      }}
      className={`tara-chip ${active ? 'tara-chip-active' : ''} ${className}`}
      {...props}
    >
      {icon && <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: '0 0 0 0.25rem',
            cursor: 'pointer',
            color: 'inherit',
            fontSize: '0.875rem',
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
          }}
          aria-label="Remove filter"
        >
          ×
        </button>
      )}
    </span>
  );
};
