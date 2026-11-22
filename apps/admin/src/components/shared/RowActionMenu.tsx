'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MoreVertical, Eye, Edit3, Trash2 } from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';

export interface RowActionMenuProps {
  onView?: () => void;
  viewHref?: string;
  viewLabel?: string;
  onEdit?: () => void;
  editHref?: string;
  editLabel?: string;
  onDelete?: () => void;
  deleteLabel?: string;
  isDeleting?: boolean;
  align?: 'right' | 'left';
}

export function RowActionMenu({
  onView,
  viewHref,
  viewLabel = 'View',
  onEdit,
  editHref,
  editLabel = 'Edit',
  onDelete,
  deleteLabel = 'Delete',
  isDeleting = false,
  align = 'right',
}: RowActionMenuProps): React.ReactElement {
  const tokens = ADMIN_THEMES.light;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearCloseTimer();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 220);
  };

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearCloseTimer();
    };
  }, [isOpen]);

  const itemBaseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.sm,
    width: '100%',
    padding: '7px 12px',
    fontSize: 12,
    fontWeight: 500,
    border: 'none',
    background: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    color: tokens.textPrimary,
    textDecoration: 'none',
    borderRadius: RADIUS.sm,
    transition: 'background-color 0.15s ease, color 0.15s ease',
    boxSizing: 'border-box',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        display: 'inline-block',
      }}
    >
      <button
        type="button"
        title="Actions"
        aria-label="Row Actions"
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: RADIUS.md,
          border: `1px solid ${isOpen ? tokens.primary : tokens.border}`,
          backgroundColor: isOpen ? tokens.surfaceSubtle : tokens.surface,
          color: isOpen ? tokens.primary : tokens.textMuted,
          cursor: 'pointer',
          padding: 0,
          transition: 'all 0.15s ease',
          outline: 'none',
        }}
      >
        <MoreVertical size={16} strokeWidth={2} />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            ...(align === 'right' ? { right: 0 } : { left: 0 }),
            minWidth: 140,
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.md,
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
            padding: 4,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* View Action */}
          {viewHref ? (
            <Link
              href={viewHref}
              onClick={() => setIsOpen(false)}
              style={itemBaseStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = tokens.surfaceSubtle;
                e.currentTarget.style.color = tokens.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = tokens.textPrimary;
              }}
            >
              <Eye size={14} strokeWidth={2} style={{ color: tokens.primary, flexShrink: 0 }} />
              <span>{viewLabel}</span>
            </Link>
          ) : onView ? (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onView();
              }}
              style={itemBaseStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = tokens.surfaceSubtle;
                e.currentTarget.style.color = tokens.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = tokens.textPrimary;
              }}
            >
              <Eye size={14} strokeWidth={2} style={{ color: tokens.primary, flexShrink: 0 }} />
              <span>{viewLabel}</span>
            </button>
          ) : null}

          {/* Edit Action */}
          {editHref ? (
            <Link
              href={editHref}
              onClick={() => setIsOpen(false)}
              style={itemBaseStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = tokens.surfaceSubtle;
                e.currentTarget.style.color = tokens.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = tokens.textPrimary;
              }}
            >
              <Edit3 size={14} strokeWidth={2} style={{ color: '#0284c7', flexShrink: 0 }} />
              <span>{editLabel}</span>
            </Link>
          ) : onEdit ? (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onEdit();
              }}
              style={itemBaseStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = tokens.surfaceSubtle;
                e.currentTarget.style.color = tokens.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = tokens.textPrimary;
              }}
            >
              <Edit3 size={14} strokeWidth={2} style={{ color: '#0284c7', flexShrink: 0 }} />
              <span>{editLabel}</span>
            </button>
          ) : null}

          {/* Delete Action */}
          {onDelete ? (
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                setIsOpen(false);
                onDelete();
              }}
              style={{
                ...itemBaseStyle,
                color: '#dc2626',
                opacity: isDeleting ? 0.6 : 1,
                cursor: isDeleting ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = '#fef2f2';
                  e.currentTarget.style.color = '#b91c1c';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#dc2626';
                }
              }}
            >
              <Trash2 size={14} strokeWidth={2} style={{ color: '#dc2626', flexShrink: 0 }} />
              <span>{isDeleting ? 'Deleting...' : deleteLabel}</span>
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
