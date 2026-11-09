import React, { useEffect } from 'react';
import { PaginatedResponseDto } from '@mastera/contracts';
import {
  ADMIN_THEMES,
  RADIUS,
  SPACING,
  ThemeMode,
} from '@mastera/ui-tokens';

export interface TableColumn<TItem> {
  key: string;
  header: string;
  render: (item: TItem, rowIndex: number) => React.ReactNode;
}

export interface PaginatedTableProps<TItem> {
  columns: TableColumn<TItem>[];
  data: PaginatedResponseDto<TItem>;
  rowKey: (item: TItem) => string;
  onPageChange: (nextPage: number) => void;
  themeMode?: ThemeMode;
  emptyMessage?: string;
}

export function PaginatedTable<TItem>({
  columns,
  data,
  rowKey,
  onPageChange,
  themeMode = 'light',
  emptyMessage = 'No records found matching the selected filters.',
}: PaginatedTableProps<TItem>): React.ReactElement {
  const tokens = ADMIN_THEMES[themeMode];

  // FR-G44: Step back automatically when a deletion empties a page > 1
  useEffect(() => {
    if (data.items.length === 0 && data.page > 1 && data.total > 0) {
      const targetPage = Math.max(1, Math.min(data.page - 1, data.totalPages));
      onPageChange(targetPage);
    }
  }, [data.items.length, data.page, data.total, data.totalPages, onPageChange]);

  const startItem =
    data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const endItem = Math.min(data.total, data.page * data.pageSize);

  return (
    <div
      style={{
        backgroundColor: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr
            style={{
              backgroundColor: tokens.surfaceSubtle,
              borderBottom: `1px solid ${tokens.border}`,
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: 'left',
                  padding: `${SPACING.md}px ${SPACING.lg}px`,
                  color: tokens.textMuted,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.items.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: SPACING.xxl,
                  textAlign: 'center',
                  color: tokens.textMuted,
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.items.map((item, idx) => (
              <tr
                key={rowKey(item)}
                style={{
                  borderBottom: `1px solid ${tokens.border}`,
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: `${SPACING.md}px ${SPACING.lg}px`,
                      color: tokens.textPrimary,
                      fontSize: 14,
                    }}
                  >
                    {col.render(item, idx)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: `${SPACING.md}px ${SPACING.lg}px`,
          borderTop: `1px solid ${tokens.border}`,
          color: tokens.textMuted,
          fontSize: 13,
        }}
      >
        <span>
          Showing {startItem} to {endItem} of {data.total}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          <button
            type="button"
            disabled={data.page <= 1}
            onClick={() => onPageChange(data.page - 1)}
            style={{
              padding: `${SPACING.xs}px ${SPACING.md}px`,
              borderRadius: RADIUS.sm,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
              cursor: data.page <= 1 ? 'not-allowed' : 'pointer',
              opacity: data.page <= 1 ? 0.5 : 1,
            }}
          >
            Previous
          </button>

          <span style={{ color: tokens.textPrimary, fontWeight: 600 }}>
            Page {data.page} of {Math.max(1, data.totalPages)}
          </span>

          <button
            type="button"
            disabled={data.page >= data.totalPages}
            onClick={() => onPageChange(data.page + 1)}
            style={{
              padding: `${SPACING.xs}px ${SPACING.md}px`,
              borderRadius: RADIUS.sm,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
              cursor: data.page >= data.totalPages ? 'not-allowed' : 'pointer',
              opacity: data.page >= data.totalPages ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}