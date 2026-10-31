import React from 'react';
import { ExternalLink } from 'lucide-react';

export interface EvidenceRowProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  sourceDoc?: string;
  onSeeWhy?: () => void;
  statusBadge?: React.ReactNode;
}

export const EvidenceRow: React.FC<EvidenceRowProps> = ({
  label,
  value,
  hint,
  sourceDoc,
  onSeeWhy,
  statusBadge,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--color-panel)',
        border: '1px solid var(--color-panel-border)',
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
      }}
      className="tara-evidence-row"
    >
      <div style={{ flex: '1 1 200px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--color-ink-soft)',
            }}
          >
            {label}
          </span>
          {sourceDoc && (
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '0.0625rem 0.375rem',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--color-chip)',
                color: 'var(--color-ink)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
              title="Verified Policy Source"
            >
              {sourceDoc}
            </span>
          )}
        </div>
        {hint && (
          <p
            style={{
              margin: '0.125rem 0 0 0',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-ink-soft)',
            }}
          >
            {hint}
          </p>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
          minWidth: 0,
          maxWidth: '100%',
        }}
      >
        <div
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--color-ink)',
            wordBreak: 'break-word',
            minWidth: 0,
          }}
        >
          {value}
        </div>
        {statusBadge}
        {onSeeWhy && (
          <button
            type="button"
            onClick={onSeeWhy}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.25rem 0.5rem',
              color: 'var(--color-cta-hover)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              textDecoration: 'underline',
            }}
            aria-label={`See reasoning why ${label} was selected`}
          >
            <span>See why</span>
            <ExternalLink size={12} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
