import React from 'react';

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  status?: 'completed' | 'current' | 'pending' | 'warning' | 'error';
  badge?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ items, className = '' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
      className={`tara-timeline ${className}`}
      role="list"
      aria-label="Workflow Timeline"
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;

        const getDotStyle = (): React.CSSProperties => {
          switch (item.status) {
            case 'completed':
              return {
                backgroundColor: 'var(--status-ok-text)',
                borderColor: 'var(--status-ok-bg)',
              };
            case 'warning':
              return {
                backgroundColor: 'var(--status-warn-text)',
                borderColor: 'var(--status-warn-bg)',
              };
            case 'error':
              return {
                backgroundColor: 'var(--status-error-text)',
                borderColor: 'var(--status-error-bg)',
              };
            case 'current':
              return {
                backgroundColor: 'var(--color-cta)',
                borderColor: '#FAF9F5',
                boxShadow: '0 0 0 3px rgba(250, 127, 98, 0.25)',
              };
            case 'pending':
            default:
              return {
                backgroundColor: 'var(--color-muted)',
                borderColor: '#FAF9F5',
              };
          }
        };

        return (
          <div
            key={item.id}
            role="listitem"
            style={{
              display: 'flex',
              gap: 'var(--space-4)',
              position: 'relative',
              paddingBottom: isLast ? '0' : 'var(--space-6)',
            }}
          >
            {/* Vertical connector line */}
            {!isLast && (
              <div
                style={{
                  position: 'absolute',
                  left: '11px',
                  top: '20px',
                  bottom: '0',
                  width: '2px',
                  backgroundColor: 'var(--color-panel-border)',
                }}
                aria-hidden="true"
              />
            )}

            {/* Indicator Dot */}
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '2px solid',
                zIndex: 1,
                ...getDotStyle(),
              }}
              aria-hidden="true"
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                }}
              />
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingTop: '1px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-2)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--weight-semibold)',
                      color: 'var(--color-ink)',
                    }}
                  >
                    {item.title}
                  </h4>
                  {item.badge}
                </div>
                <time
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-ink-soft)',
                  }}
                >
                  {item.time}
                </time>
              </div>
              {item.description && (
                <p
                  style={{
                    margin: '0.25rem 0 0 0',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-ink-soft)',
                    lineHeight: 'var(--leading-normal)',
                  }}
                >
                  {item.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
