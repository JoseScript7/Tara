import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  dense?: boolean;
  emptyText?: string;
  onRowClick?: (row: T) => void;
  selectedRowId?: string | number;
  rowKey?: (row: T) => string | number;
  caption?: string;
  className?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  dense = false,
  emptyText = 'No records found',
  onRowClick,
  selectedRowId,
  rowKey = (r) => r.id || JSON.stringify(r),
  caption,
  className = '',
}: TableProps<T>) {
  const cellPadding = dense ? '0.375rem 0.625rem' : '0.75rem 1rem';
  const headerFontSize = dense ? 'var(--text-xs)' : 'var(--text-sm)';
  const bodyFontSize = dense ? 'var(--text-xs)' : 'var(--text-sm)';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-panel-border)',
        backgroundColor: 'var(--color-panel)',
        boxSizing: 'border-box',
      }}
      className={`tara-table-wrapper ${className}`}
    >
      <table
        style={{
          width: 'max-content',
          minWidth: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        {caption && (
          <caption
            style={{
              padding: 'var(--space-3)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              textAlign: 'left',
              color: 'var(--color-ink)',
              borderBottom: '1px solid var(--color-panel-border)',
            }}
          >
            {caption}
          </caption>
        )}
        <thead>
          <tr
            style={{
              backgroundColor: 'rgba(21, 22, 21, 0.03)',
              borderBottom: '1px solid var(--color-panel-border)',
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={{
                  padding: cellPadding,
                  fontSize: headerFontSize,
                  fontWeight: 'var(--weight-semibold)',
                  color: 'var(--color-ink-soft)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  textAlign: col.align || 'left',
                  width: col.width,
                  whiteSpace: 'nowrap',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: 'var(--space-8)',
                  textAlign: 'center',
                  color: 'var(--color-ink-soft)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const key = rowKey(row);
              const isSelected = selectedRowId !== undefined && selectedRowId === key;

              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  style={{
                    borderBottom: '1px solid var(--color-panel-border)',
                    backgroundColor: isSelected
                      ? 'rgba(254, 138, 112, 0.12)'
                      : index % 2 === 1
                        ? 'rgba(21, 22, 21, 0.015)'
                        : 'transparent',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background-color var(--duration-fast) var(--ease-out)',
                  }}
                  className={`tara-table-row ${isSelected ? 'is-selected' : ''}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: cellPadding,
                        fontSize: bodyFontSize,
                        color: 'var(--color-ink)',
                        textAlign: col.align || 'left',
                        verticalAlign: 'middle',
                      }}
                    >
                      {col.render ? col.render(row, index) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
