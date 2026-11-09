import React, { useState } from 'react';
import { QuestionItemDto } from '@mastera/contracts';
import {
  ADMIN_THEMES,
  RADIUS,
  SPACING,
  STUDENT_THEMES,
  ThemeMode,
} from '@mastera/ui-tokens';
import { FileText, ExternalLink } from 'lucide-react';

export interface StudentSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  chapterMarkdownLatex?: string | undefined;
  pdfStorageKey?: string | null | undefined;
  pdfPreviewUrl?: string | null | undefined;
  question?: QuestionItemDto | undefined;
  themeMode?: ThemeMode | undefined;
}

export function StudentSimulatorModal({
  isOpen,
  onClose,
  title,
  chapterMarkdownLatex,
  pdfStorageKey,
  pdfPreviewUrl,
  question,
  themeMode = 'light',
}: StudentSimulatorModalProps): React.ReactElement | null {
  const [viewport, setViewport] = useState<'DESKTOP' | 'MOBILE'>('MOBILE');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  if (!isOpen) return null;

  const adminTokens = ADMIN_THEMES[themeMode];
  const studentTokens = STUDENT_THEMES[themeMode];

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: adminTokens.surface,
          borderRadius: RADIUS.xl,
          padding: SPACING.xl,
          width: viewport === 'MOBILE' ? 460 : 820,
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: `1px solid ${adminTokens.border}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.lg,
          }}
        >
          <h2
            style={{
              margin: 0,
              color: adminTokens.textPrimary,
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            Review as student
          </h2>

          <div style={{ display: 'flex', gap: SPACING.xs }}>
            <button
              type="button"
              onClick={() => setViewport('DESKTOP')}
              style={{
                padding: `${SPACING.xs}px ${SPACING.md}px`,
                borderRadius: RADIUS.sm,
                border: `1px solid ${adminTokens.border}`,
                backgroundColor:
                  viewport === 'DESKTOP'
                    ? adminTokens.primary
                    : adminTokens.surface,
                color:
                  viewport === 'DESKTOP'
                    ? adminTokens.sidebarText
                    : adminTokens.textPrimary,
                cursor: 'pointer',
              }}
            >
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setViewport('MOBILE')}
              style={{
                padding: `${SPACING.xs}px ${SPACING.md}px`,
                borderRadius: RADIUS.sm,
                border: `1px solid ${adminTokens.border}`,
                backgroundColor:
                  viewport === 'MOBILE'
                    ? adminTokens.primary
                    : adminTokens.surface,
                color:
                  viewport === 'MOBILE'
                    ? adminTokens.sidebarText
                    : adminTokens.textPrimary,
                cursor: 'pointer',
              }}
            >
              Mobile
            </button>
          </div>
        </div>

        {/* Simulated Phone Frame */}
        <div
          style={{
            border: `3px solid ${studentTokens.ink}`,
            borderRadius: RADIUS.xl,
            padding: SPACING.lg,
            backgroundColor: studentTokens.surface,
            color: studentTokens.textPrimary,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: studentTokens.textMuted,
              fontStyle: 'italic',
              marginBottom: SPACING.md,
            }}
          >
            Student Simulation (Correct answers hidden)
          </div>

          <h3 style={{ marginTop: 0, marginBottom: SPACING.md }}>{title}</h3>

          {/* PDF Viewer for Student Simulation */}
          {(pdfPreviewUrl || pdfStorageKey) && (
            <div
              style={{
                marginBottom: SPACING.lg,
                borderRadius: RADIUS.md,
                border: `1px solid ${studentTokens.border}`,
                backgroundColor: studentTokens.surface,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: `${SPACING.sm}px ${SPACING.md}px`,
                  backgroundColor: studentTokens.primarySoft,
                  borderBottom: `1px solid ${studentTokens.border}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
                  <FileText size={18} color={studentTokens.primary} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: studentTokens.textPrimary }}>
                    {pdfStorageKey ? pdfStorageKey.split('/').pop() : 'Document.pdf'}
                  </span>
                  <span style={{ fontSize: 11, color: studentTokens.textMuted }}>
                    (PDF Document)
                  </span>
                </div>

                {pdfPreviewUrl && (
                  <a
                    href={pdfPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      color: studentTokens.primary,
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={14} />
                    Open full screen
                  </a>
                )}
              </div>

              {pdfPreviewUrl ? (
                <iframe
                  src={pdfPreviewUrl}
                  title="PDF Reader"
                  style={{
                    width: '100%',
                    height: viewport === 'MOBILE' ? '380px' : '520px',
                    border: 'none',
                    display: 'block',
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: SPACING.xl,
                    textAlign: 'center',
                    backgroundColor: studentTokens.surface,
                  }}
                >
                  <FileText size={48} color={studentTokens.primary} style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: studentTokens.textPrimary }}>
                    {pdfStorageKey ? pdfStorageKey.split('/').pop() : 'PDF Document Attached'}
                  </div>
                  <p style={{ fontSize: 13, color: studentTokens.textMuted, maxWidth: 380, margin: '8px auto 0', lineHeight: 1.5 }}>
                    This chapter delivers an official PDF textbook/notes document. Students stream or download this file for offline reading in the Mastera student app.
                  </p>
                </div>
              )}
            </div>
          )}

          {chapterMarkdownLatex && (
            <div
              style={{
                lineHeight: 1.6,
                fontSize: 15,
                whiteSpace: 'pre-wrap',
                marginBottom: SPACING.lg,
              }}
            >
              {chapterMarkdownLatex}
            </div>
          )}

          {question && (
            <div>
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: SPACING.md,
                  fontSize: 16,
                }}
              >
                Question {question.displayNumber}: {question.promptLatex}
              </div>

              {question.options && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: SPACING.sm,
                  }}
                >
                  {question.options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedOptionId(opt.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: SPACING.md,
                          padding: SPACING.md,
                          borderRadius: RADIUS.md,
                          border: `2px solid ${
                            isSelected
                              ? studentTokens.primary
                              : studentTokens.border
                          }`,
                          backgroundColor: isSelected
                            ? studentTokens.primarySoft
                            : studentTokens.surface,
                          color: studentTokens.textPrimary,
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            color: isSelected
                              ? studentTokens.primary
                              : studentTokens.textMuted,
                          }}
                        >
                          {opt.id}
                        </span>
                        <span>{opt.textLatex}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: SPACING.xl,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${studentTokens.primary}`,
                backgroundColor: studentTokens.surface,
                color: studentTokens.primary,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
