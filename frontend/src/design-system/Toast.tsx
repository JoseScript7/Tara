import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastProps {
  id: string;
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  onDismiss,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'var(--status-ok-bg)',
          color: 'var(--status-ok-text)',
          border: 'var(--status-ok-border)',
          icon: <CheckCircle2 size={18} strokeWidth={2.2} />,
        };
      case 'warning':
        return {
          bg: 'var(--status-warn-bg)',
          color: 'var(--status-warn-text)',
          border: 'var(--status-warn-border)',
          icon: <AlertTriangle size={18} strokeWidth={2.2} />,
        };
      case 'error':
        return {
          bg: 'var(--status-error-bg)',
          color: 'var(--status-error-text)',
          border: 'var(--status-error-border)',
          icon: <AlertCircle size={18} strokeWidth={2.2} />,
        };
      case 'info':
      default:
        return {
          bg: 'var(--status-info-bg)',
          color: 'var(--status-info-text)',
          border: 'var(--status-info-border)',
          icon: <Info size={18} strokeWidth={2.2} />,
        };
    }
  };

  const config = getConfig();

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: '#FFFFFF',
        border: `1.5px solid ${config.border}`,
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: 'calc(100vw - 2rem)',
        boxSizing: 'border-box',
        animation: 'tara-slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="tara-toast"
    >
      <div style={{ color: config.color, flexShrink: 0, marginTop: '2px' }} aria-hidden="true">
        {config.icon}
      </div>
      <div style={{ flex: 1 }}>
        <h5
          style={{
            margin: 0,
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-ink)',
          }}
        >
          {title}
        </h5>
        {message && (
          <p
            style={{
              margin: '0.25rem 0 0 0',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-ink-soft)',
              lineHeight: 'var(--leading-normal)',
            }}
          >
            {message}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        style={{
          background: 'none',
          border: 'none',
          padding: '0.25rem',
          color: 'var(--color-ink-soft)',
          cursor: 'pointer',
          borderRadius: 'var(--radius-sm)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Close notification"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
};
