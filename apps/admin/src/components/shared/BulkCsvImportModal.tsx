import React, { useState } from 'react';
import {
  ADMIN_THEMES,
  SPACING,
  RADIUS,
  ThemeMode,
} from '@mastera/ui-tokens';
import { CsvImportDryRunResultDto } from '@mastera/contracts';

export interface BulkCsvImportModalProps {
  isOpen: boolean;
  targetExamSetOrQuizTitle: string;
  onClose: () => void;
  onUploadCsv: (csvText: string) => Promise<CsvImportDryRunResultDto>;
  onCommitImport: () => Promise<void>;
  themeMode?: ThemeMode;
}

export function BulkCsvImportModal({
  isOpen,
  targetExamSetOrQuizTitle,
  onClose,
  onUploadCsv,
  onCommitImport,
  themeMode = 'light',
}: BulkCsvImportModalProps): React.ReactElement | null {
  const [csvContent, setCsvContent] = useState('');
  const [dryRunResult, setDryRunResult] = useState<CsvImportDryRunResultDto | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const tokens = ADMIN_THEMES[themeMode];

  if (!isOpen) return null;

  const handleDryRun = async () => {
    setIsProcessing(true);
    try {
      const res = await onUploadCsv(csvContent);
      setDryRunResult(res);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommit = async () => {
    setIsProcessing(true);
    try {
      await onCommitImport();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: tokens.sidebarBg,
        opacity: 0.98,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: 580,
          maxHeight: '90vh',
          backgroundColor: tokens.surface,
          borderRadius: RADIUS.lg,
          border: `1px solid ${tokens.border}`,
          padding: SPACING.xl,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.md,
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: tokens.textPrimary }}>
              Bulk Question CSV Import
            </h2>
            <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2 }}>
              Target: {targetExamSetOrQuizTitle}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 18,
              cursor: 'pointer',
              color: tokens.textMuted,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ fontSize: 13, color: tokens.textMuted }}>
          Paste or upload CSV questions with columns: <code>display_number, question_type, prompt_latex, options, correct_answer, explanation_latex</code>.
        </div>

        <textarea
          value={csvContent}
          onChange={(e) => setCsvContent(e.target.value)}
          placeholder="Paste CSV rows here..."
          rows={8}
          style={{
            width: '100%',
            padding: SPACING.md,
            borderRadius: RADIUS.md,
            border: `1px solid ${tokens.border}`,
            backgroundColor: tokens.background,
            color: tokens.textPrimary,
            fontFamily: 'monospace',
            fontSize: 12,
            boxSizing: 'border-box',
          }}
        />

        {dryRunResult && (
          <div
            style={{
              padding: SPACING.md,
              borderRadius: RADIUS.md,
              backgroundColor: dryRunResult.valid ? tokens.successBg : tokens.dangerBg,
              border: `1px solid ${dryRunResult.valid ? tokens.success : tokens.danger}`,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, color: dryRunResult.valid ? tokens.success : tokens.danger }}>
              {dryRunResult.valid
                ? `✓ Validation passed: ${dryRunResult.validRowsCount} questions ready to import.`
                : `✗ Validation failed with ${dryRunResult.errors.length} error(s).`}
            </div>
            {dryRunResult.errors.length > 0 && (
              <ul style={{ margin: '8px 0 0 16px', padding: 0, fontSize: 12, color: tokens.danger }}>
                {dryRunResult.errors.slice(0, 5).map((err, idx) => (
                  <li key={idx}>
                    Row {err.rowNumber} [{err.column}]: {err.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: SPACING.md }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: `${SPACING.sm}px ${SPACING.lg}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          {!dryRunResult?.valid ? (
            <button
              type="button"
              disabled={csvContent.trim().length === 0 || isProcessing}
              onClick={handleDryRun}
              style={{
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: 'none',
                backgroundColor: tokens.primary,
                color: tokens.surface,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isProcessing ? 'Validating...' : 'Validate CSV (Dry Run)'}
            </button>
          ) : (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleCommit}
              style={{
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: 'none',
                backgroundColor: tokens.success,
                color: tokens.surface,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isProcessing ? 'Importing...' : 'Commit Questions'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
