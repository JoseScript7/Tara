import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = '',
  style,
  ...props
}) => {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: '0.375rem 0.875rem',
      fontSize: 'var(--text-xs)',
      minHeight: '36px',
      gap: '0.375rem',
    },
    md: {
      padding: '0.625rem 1.25rem',
      fontSize: 'var(--text-sm)',
      minHeight: '44px', // WCAG target size
      gap: '0.5rem',
    },
    lg: {
      padding: '0.875rem 1.75rem',
      fontSize: 'var(--text-base)',
      minHeight: '52px',
      gap: '0.625rem',
    },
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: 'var(--color-panel)',
          color: 'var(--color-ink)',
          border: '1px solid var(--color-panel-border)',
          boxShadow: 'var(--shadow-sm)',
        };
      case 'quiet':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-ink-soft)',
          border: '1px solid transparent',
        };
      case 'primary':
      default:
        return {
          backgroundColor: 'var(--color-cta)',
          color: 'var(--color-cta-text)', // Primary ink (#151615) - 7.15:1 WCAG AA pass
          border: 'none',
          boxShadow: 'var(--shadow-sm)',
          fontWeight: 'var(--weight-semibold)',
        };
    }
  };

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-full)',
    fontFamily: 'inherit',
    fontWeight: 'var(--weight-medium)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'transform var(--duration-fast) var(--ease-out), background-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)',
    outline: 'none',
    width: fullWidth ? '100%' : 'auto',
    textDecoration: 'none',
    ...sizeStyles[size],
    ...getVariantStyles(),
    ...style,
  };

  return (
    <button
      disabled={disabled || loading}
      style={baseStyle}
      className={`tara-btn tara-btn-${variant} ${className}`}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'tara-spin 0.75s linear infinite',
          }}
          aria-hidden="true"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span aria-hidden="true">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span aria-hidden="true">{icon}</span>}
        </>
      )}
    </button>
  );
};
