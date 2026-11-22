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
  width?: string | number;
  minWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  render: (item: TItem, rowIndex: number) => React.ReactNode;
}

export interface PaginatedTableProps<TItem> {
  columns: TableColumn<TItem>[];
  data: PaginatedResponseDto<TItem>;
  rowKey: (item: TItem) => string;
  onPageChange: (nextPage: number) => void;
  themeMode?: ThemeMode;
  emptyMessage?: string;
  rowHeight?: number;
}

/**
 * Extracts plain text from nested React nodes or strings for use in title/tooltip attributes.
 */
function extractTextContent(node: React.ReactNode): string | undefined {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return undefined;
  }
  if (typeof node === 'string') {
    const trimmed = node.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof node === 'number') {
    return String(node);
  }
  if (React.isValidElement(node)) {
    const props = node.props as Record<string, unknown>;
    if (typeof props.title === 'string' && props.title.trim().length > 0) {
      return props.title.trim();
    }
    if (props.children) {
      if (typeof props.children === 'string') {
        const trimmed = props.children.trim();
        return trimmed.length > 0 ? trimmed : undefined;
      }
      if (Array.isArray(props.children)) {
        const parts = props.children
          .map((c) => extractTextContent(c))
          .filter((s): s is string => typeof s === 'string' && s.length > 0);
        return parts.length > 0 ? parts.join(' ') : undefined;
      }
      return extractTextContent(props.children as React.ReactNode);
    }
  }
  return undefined;
}

export function PaginatedTable<TItem>({
  columns,
  data,
  rowKey,
  onPageChange,
  themeMode = 'light',
  emptyMessage = 'No records found matching the selected filters.',
  rowHeight = 58,
}: PaginatedTableProps<TItem>): React.ReactElement {
  const tokens = ADMIN_THEMES[themeMode];

  const pageSize = data.pageSize && data.pageSize > 0 ? data.pageSize : 10;
  const currentPage = Math.max(1, data.page || 1);
  const totalItems = data.total ?? data.items.length;
  const totalPages =
    data.totalPages && data.totalPages > 0
      ? data.totalPages
      : Math.max(1, Math.ceil(totalItems / pageSize));

  // Determine if caller passed the full array (client-side dataset) that needs page slicing
  const isFullDataset = data.items.length > pageSize;
  const validPage = Math.max(1, Math.min(currentPage, totalPages));

  // Step back automatically when page exceeds totalPages (e.g. after search filter or deletion)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      onPageChange(totalPages);
    }
  }, [currentPage, totalPages, onPageChange]);

  // Sliced items for display on the current page
  const displayItems = isFullDataset
    ? data.items.slice((validPage - 1) * pageSize, validPage * pageSize)
    : data.items;

  const startItem = totalItems === 0 ? 0 : (validPage - 1) * pageSize + 1;
  const endItem = Math.min(
    totalItems,
    (validPage - 1) * pageSize + displayItems.length
  );

  const cellContentMaxHeight = Math.max(36, rowHeight - 16);

  return (
    <div
      style={{
        backgroundColor: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: tokens.surfaceSubtle,
                borderBottom: `1px solid ${tokens.border}`,
                height: 44,
              }}
            >
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    textAlign: col.align || 'left',
                    padding: `0 ${SPACING.lg}px`,
                    color: tokens.textMuted,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    height: 44,
                    boxSizing: 'border-box',
                    ...(col.width ? { width: col.width } : {}),
                    ...(col.minWidth ? { minWidth: col.minWidth } : {}),
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {totalItems === 0 || displayItems.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: SPACING.xxl,
                    textAlign: 'center',
                    color: tokens.textMuted,
                    fontSize: 13,
                    height: 140,
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayItems.map((item, idx) => {
                const actualIndex = isFullDataset
                  ? (validPage - 1) * pageSize + idx
                  : idx;
                const renderedKey = rowKey(item);

                return (
                  <tr
                    key={renderedKey}
                    style={{
                      borderBottom: `1px solid ${tokens.border}`,
                      height: rowHeight,
                      maxHeight: rowHeight,
                      minHeight: rowHeight,
                      boxSizing: 'border-box',
                    }}
                  >
                    {columns.map((col) => {
                      const rendered = col.render(item, actualIndex);
                      const tooltip = extractTextContent(rendered);
                      const justify =
                        col.align === 'right'
                          ? 'flex-end'
                          : col.align === 'center'
                          ? 'center'
                          : 'flex-start';

                      const isActionsCol = col.key === 'actions';

                      return (
                        <td
                          key={col.key}
                          style={{
                            height: rowHeight,
                            maxHeight: rowHeight,
                            padding: `0 ${SPACING.lg}px`,
                            color: tokens.textPrimary,
                            fontSize: 13,
                            verticalAlign: 'middle',
                            boxSizing: 'border-box',
                            overflow: isActionsCol ? 'visible' : 'hidden',
                            position: isActionsCol ? 'relative' : undefined,
                            zIndex: isActionsCol ? 20 : undefined,
                            ...(col.width ? { width: col.width } : {}),
                            ...(col.minWidth ? { minWidth: col.minWidth } : {}),
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              maxHeight: cellContentMaxHeight,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: justify,
                              overflow: isActionsCol ? 'visible' : 'hidden',
                              position: isActionsCol ? 'relative' : undefined,
                              width: '100%',
                            }}
                          >
                            {isActionsCol ? (
                              rendered
                            ) : (
                              <div
                                style={{
                                  maxHeight: cellContentMaxHeight,
                                  width: '100%',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  lineHeight: '1.4',
                                  wordBreak: 'break-word',
                                  textAlign: col.align || 'left',
                                }}
                                title={tooltip}
                              >
                                {rendered}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: `${SPACING.sm}px ${SPACING.lg}px`,
          borderTop: `1px solid ${tokens.border}`,
          backgroundColor: tokens.surface,
          color: tokens.textMuted,
          fontSize: 13,
          minHeight: 52,
          boxSizing: 'border-box',
          flexWrap: 'wrap',
          gap: SPACING.md,
        }}
      >
        <span>
          Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalItems}</strong> entries
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          <button
            type="button"
            disabled={validPage <= 1}
            onClick={() => onPageChange(validPage - 1)}
            style={{
              padding: `5px ${SPACING.md}px`,
              borderRadius: RADIUS.sm,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
              fontSize: 12,
              fontWeight: 500,
              cursor: validPage <= 1 ? 'not-allowed' : 'pointer',
              opacity: validPage <= 1 ? 0.45 : 1,
            }}
          >
            Previous
          </button>

          <span
            style={{
              color: tokens.textPrimary,
              fontWeight: 600,
              fontSize: 13,
              minWidth: 80,
              textAlign: 'center',
            }}
          >
            Page {validPage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={validPage >= totalPages}
            onClick={() => onPageChange(validPage + 1)}
            style={{
              padding: `5px ${SPACING.md}px`,
              borderRadius: RADIUS.sm,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
              fontSize: 12,
              fontWeight: 500,
              cursor: validPage >= totalPages ? 'not-allowed' : 'pointer',
              opacity: validPage >= totalPages ? 0.45 : 1,
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
