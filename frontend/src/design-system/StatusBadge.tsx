import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info as InfoIcon,
  Clock,
  HelpCircle,
} from 'lucide-react';

export type StatusType =
  | 'ok'
  | 'warning'
  | 'error'
  | 'info'
  | 'pending-ops'
  | 'stale';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType;
  label: string;
  size?: 'sm' | 'md';
  showPulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  showPulse = false,
  className = '',
  style,
  ...props
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'ok':
        return {
          bg: 'var(--status-ok-bg)',
          color: 'var(--status-ok-text)',
          border: 'var(--status-ok-border)',
          icon: <CheckCircle2 size={size === 'sm' ? 12 : 14} strokeWidth={2.2} />,
          pulseColor: '#2E7D32',
        };
      case 'warning':
        return {
          bg: 'var(--status-warn-bg)',
          color: 'var(--status-warn-text)',
          border: 'var(--status-warn-border)',
          icon: <AlertTriangle size={size === 'sm' ? 12 : 14} strokeWidth={2.2} />,
          pulseColor: '#F57F17',
        };
      case 'error':
        return {
          bg: 'var(--status-error-bg)',
          color: 'var(--status-error-text)',
          border: 'var(--status-error-border)',
          icon: <XCircle size={size === 'sm' ? 12 : 14} strokeWidth={2.2} />,
          pulseColor: '#C62828',
        };
      case 'info':
        return {
          bg: 'var(--status-info-bg)',
          color: 'var(--status-info-text)',
          border: 'var(--status-info-border)',
          icon: <InfoIcon size={size === 'sm' ? 12 : 14} strokeWidth={2.2} />,
          pulseColor: '#1565C0',
        };
      case 'pending-ops':
        return {
          bg: 'var(--status-pending-bg)',
          color: 'var(--status-pending-text)',
          border: 'var(--status-pending-border)',
          icon: <Clock size={size === 'sm' ? 12 : 14} strokeWidth={2.2} />,
          pulseColor: '#E65100',
        };
      case 'stale':
      default:
        return {
          bg: 'var(--status-stale-bg)',
          color: 'var(--status-stale-text)',
          border: 'var(--status-stale-border)',
          icon: <HelpCircle size={size === 'sm' ? 12 : 14} strokeWidth={2.2} />,
          pulseColor: '#757575',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: size === 'sm' ? '0.125rem 0.5rem' : '0.25rem 0.625rem',
        borderRadius: 'var(--radius-full)',
        fontSize: size === 'sm' ? 'var(--text-xs)' : 'var(--text-sm)',
        fontWeight: 'var(--weight-semibold)',
        lineHeight: 1.25,
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        maxWidth: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
      className={`tara-status-badge tara-status-${status} ${className}`}
      {...props}
    >
      {showPulse && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: config.pulseColor,
            display: 'inline-block',
          }}
          aria-hidden="true"
        />
      )}
      <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
        {config.icon}
      </span>
      <span>{label}</span>
    </span>
  );
};
