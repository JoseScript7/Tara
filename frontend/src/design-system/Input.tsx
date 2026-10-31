import React, { useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  fullWidth = true,
  disabled,
  id,
  className = '',
  style,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
        width: fullWidth ? '100%' : 'auto',
      }}
      className={`tara-input-group ${className}`}
    >
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--color-ink)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          {label}
          {props.required && (
            <span style={{ color: 'var(--color-negative)' }} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {leftIcon && (
          <span
            style={{
              position: 'absolute',
              left: '0.875rem',
              color: 'var(--color-ink-soft)',
              display: 'inline-flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          style={{
            width: '100%',
            minHeight: '44px', // WCAG AA touch target
            padding: `0.625rem ${rightIcon ? '2.5rem' : '0.875rem'} 0.625rem ${
              leftIcon ? '2.5rem' : '0.875rem'
            }`,
            fontSize: 'var(--text-base)',
            fontFamily: 'inherit',
            color: 'var(--color-ink)',
            backgroundColor: disabled ? 'rgba(21, 22, 21, 0.04)' : '#FFFFFF',
            border: `1.5px solid ${
              error ? 'var(--color-negative)' : 'var(--color-panel-border)'
            }`,
            borderRadius: 'var(--radius-md)',
            outline: 'none',
            transition: 'border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)',
            boxSizing: 'border-box',
            ...style,
          }}
          className="tara-input"
          {...props}
        />

        {rightIcon && (
          <span
            style={{
              position: 'absolute',
              right: '0.875rem',
              color: 'var(--color-ink-soft)',
              display: 'inline-flex',
              alignItems: 'center',
            }}
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        )}
      </div>

      {error ? (
        <span
          id={errorId}
          role="alert"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-negative)',
            fontWeight: 'var(--weight-medium)',
          }}
        >
          {error}
        </span>
      ) : helperText ? (
        <span
          id={helperId}
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-ink-soft)',
          }}
        >
          {helperText}
        </span>
      ) : null}
    </div>
  );
};
