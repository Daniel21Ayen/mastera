'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Sparkles,
  X,
  ChevronRight,
  Info,
} from 'lucide-react';
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
  targetType?: 'EXAM_SET' | 'QUIZ_CHAPTER' | undefined;
  availableExamSets?: { id: string; title: string; examSetCode: string }[] | undefined;
  availableCourses?: { id: string; code: string; title: string }[] | undefined;
  sampleTemplateUrl?: string | undefined;
  sampleCsvContent?: string | undefined;
  onClose: () => void;
  onUploadCsv: (
    csvText: string,
    targetId?: string | undefined,
    courseId?: string | undefined
  ) => Promise<CsvImportDryRunResultDto>;
  onCommitImport: (
    csvText: string,
    targetId?: string | undefined,
    courseId?: string | undefined
  ) => Promise<void>;
  themeMode?: ThemeMode | undefined;
}

export function BulkCsvImportModal({
  isOpen,
  targetExamSetOrQuizTitle,
  targetType = 'EXAM_SET',
  availableExamSets = [],
  availableCourses = [],
  sampleTemplateUrl,
  sampleCsvContent,
  onClose,
  onUploadCsv,
  onCommitImport,
  themeMode = 'light',
}: BulkCsvImportModalProps): React.ReactElement | null {
  const [csvContent, setCsvContent] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [dryRunResult, setDryRunResult] = useState<CsvImportDryRunResultDto | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const tokens = ADMIN_THEMES[themeMode];

  useEffect(() => {
    if (isOpen) {
      setDryRunResult(null);
      setStatusMessage(null);
      if (availableExamSets.length > 0 && !selectedTargetId) {
        setSelectedTargetId(availableExamSets[0]?.id || '');
      }
      if (availableCourses.length > 0 && !selectedCourseId) {
        setSelectedCourseId(availableCourses[0]?.id || '');
      }
    }
  }, [isOpen, availableExamSets, availableCourses, selectedTargetId, selectedCourseId]);

  if (!isOpen) return null;

  const handleProcessFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'text/plain') {
      alert('Please upload a valid .csv file.');
      return;
    }

    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    setDryRunResult(null);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      setCsvContent(text);
    };
    reader.onerror = () => {
      alert('Failed to read CSV file. Please verify file encoding.');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]!);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]!);
    }
  };

  const handleLoadSample = () => {
    if (sampleCsvContent) {
      setCsvContent(sampleCsvContent);
      setFileName('sample_questions.csv');
      setFileSize(`${(sampleCsvContent.length / 1024).toFixed(1)} KB`);
      setActiveTab('paste');
      setDryRunResult(null);
    }
  };

  const handleDownloadSample = () => {
    if (sampleTemplateUrl) {
      const link = document.createElement('a');
      link.href = sampleTemplateUrl;
      link.download = sampleTemplateUrl.split('/').pop() || 'sample_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (sampleCsvContent) {
      const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sample_questions_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleClear = () => {
    setCsvContent('');
    setFileName(null);
    setFileSize(null);
    setDryRunResult(null);
    setStatusMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDryRun = async () => {
    if (!csvContent.trim()) return;
    setIsProcessing(true);
    setStatusMessage('Validating CSV structure and LaTeX formulas...');
    try {
      const res = await onUploadCsv(
        csvContent,
        selectedTargetId || undefined,
        selectedCourseId || undefined
      );
      setDryRunResult(res);
      setStatusMessage(null);
    } catch (err: any) {
      console.error('Validation error:', err);
      setStatusMessage(`Validation failed: ${err?.message || 'Server error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommit = async () => {
    if (!dryRunResult?.valid) return;
    setIsProcessing(true);
    setStatusMessage('Importing questions into database...');
    try {
      await onCommitImport(
        csvContent,
        selectedTargetId || undefined,
        selectedCourseId || undefined
      );
      onClose();
    } catch (err: any) {
      console.error('Commit error:', err);
      setStatusMessage(`Import failed: ${err?.message || 'Server error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const lineCount = csvContent ? csvContent.split('\n').filter((l) => l.trim().length > 0).length : 0;
  const questionCount = lineCount > 1 ? lineCount - 1 : 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: SPACING.md,
      }}
    >
      <div
        style={{
          width: 720,
          maxWidth: '96vw',
          maxHeight: '92vh',
          backgroundColor: tokens.surface,
          borderRadius: RADIUS.lg,
          border: `1px solid ${tokens.border}`,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: `${SPACING.lg}px ${SPACING.xl}px`,
            borderBottom: `1px solid ${tokens.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: tokens.surfaceSubtle,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: RADIUS.md,
                backgroundColor: tokens.surfaceSubtle,
                color: tokens.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: tokens.textPrimary }}>
                Bulk CSV Question Import
              </h2>
              <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2 }}>
                Target: <strong style={{ color: tokens.textPrimary }}>{targetExamSetOrQuizTitle}</strong>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: SPACING.xs,
              borderRadius: RADIUS.sm,
              cursor: 'pointer',
              color: tokens.textMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: SPACING.xl,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.lg,
          }}
        >
          {/* Target / Course Selectors (if available) */}
          {(availableCourses.length > 0 || availableExamSets.length > 0) && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: availableCourses.length > 0 && availableExamSets.length > 0 ? '1fr 1fr' : '1fr',
                gap: SPACING.md,
                padding: SPACING.md,
                borderRadius: RADIUS.md,
                backgroundColor: tokens.surfaceSubtle,
                border: `1px solid ${tokens.border}`,
              }}
            >
              {availableCourses.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textMuted, marginBottom: 4 }}>
                    Target Academic Course
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: RADIUS.sm,
                      border: `1px solid ${tokens.border}`,
                      backgroundColor: tokens.surface,
                      color: tokens.textPrimary,
                      fontSize: 13,
                    }}
                  >
                    <option value="">Auto-resolve from context</option>
                    {availableCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {availableExamSets.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textMuted, marginBottom: 4 }}>
                    Target Exam Set
                  </label>
                  <select
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: RADIUS.sm,
                      border: `1px solid ${tokens.border}`,
                      backgroundColor: tokens.surface,
                      color: tokens.textPrimary,
                      fontSize: 13,
                    }}
                  >
                    <option value="">Auto-create / Auto-resolve Exam Set</option>
                    {availableExamSets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.examSetCode} — {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Action Tabs & Sample Helpers */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: SPACING.sm }}>
            <div style={{ display: 'flex', gap: SPACING.xs, backgroundColor: tokens.surfaceSubtle, padding: 4, borderRadius: RADIUS.md }}>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: RADIUS.sm,
                  border: 'none',
                  backgroundColor: activeTab === 'upload' ? tokens.surface : 'transparent',
                  color: activeTab === 'upload' ? tokens.primary : tokens.textMuted,
                  fontWeight: activeTab === 'upload' ? 600 : 500,
                  fontSize: 13,
                  boxShadow: activeTab === 'upload' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                }}
              >
                <UploadCloud size={16} />
                Upload CSV File
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: RADIUS.sm,
                  border: 'none',
                  backgroundColor: activeTab === 'paste' ? tokens.surface : 'transparent',
                  color: activeTab === 'paste' ? tokens.primary : tokens.textMuted,
                  fontWeight: activeTab === 'paste' ? 600 : 500,
                  fontSize: 13,
                  boxShadow: activeTab === 'paste' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                }}
              >
                <FileText size={16} />
                Paste / Edit CSV Text
                {lineCount > 1 && (
                  <span
                    style={{
                      fontSize: 11,
                      backgroundColor: tokens.surfaceSubtle,
                      color: tokens.primary,
                      padding: '1px 6px',
                      borderRadius: 10,
                      fontWeight: 700,
                    }}
                  >
                    {questionCount}
                  </span>
                )}
              </button>
            </div>

            <div style={{ display: 'flex', gap: SPACING.xs, alignItems: 'center' }}>
              {(sampleTemplateUrl || sampleCsvContent) && (
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                  title="Download standard RFC-4180 CSV template"
                >
                  <Download size={14} />
                  Download Sample CSV
                </button>
              )}
              {sampleCsvContent && (
                <button
                  type="button"
                  onClick={handleLoadSample}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surfaceSubtle,
                    color: tokens.primary,
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                  title="Populate with pre-verified sample data for instant testing"
                >
                  <Sparkles size={14} />
                  Load Sample Data
                </button>
              )}
              {csvContent && (
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 10px',
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.danger,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                  title="Clear loaded CSV"
                >
                  <Trash2 size={13} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Drag & Drop Area */}
          {activeTab === 'upload' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? tokens.primary : tokens.border}`,
                borderRadius: RADIUS.lg,
                padding: `${SPACING.xxl}px ${SPACING.lg}px`,
                backgroundColor: isDragging
                  ? tokens.surfaceSubtle
                  : tokens.surfaceSubtle,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: tokens.surface,
                  border: `1px solid ${tokens.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: tokens.primary,
                  marginBottom: SPACING.md,
                }}
              >
                <UploadCloud size={28} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                {fileName ? fileName : 'Drag & drop your CSV file here, or browse'}
              </div>
              <div style={{ fontSize: 12, color: tokens.textMuted, maxWidth: 440 }}>
                {fileName
                  ? `File ready: ${fileSize} • ~${questionCount} questions detected. Click or drop another file to replace.`
                  : 'Accepts standard RFC-4180 CSV files up to 2 MB (max 500 rows). Preserves Amharic text and LaTeX math formulas.'}
              </div>
            </div>
          )}

          {/* Direct Paste / Preview Textarea */}
          {activeTab === 'paste' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: tokens.textMuted, marginBottom: 6 }}>
                <span>Required headers: <code>question_type,prompt_latex,option_a,option_b,option_c,option_d,correct_answer,explanation_latex</code></span>
                <span>{lineCount > 1 ? `${questionCount} data row(s)` : 'No data rows yet'}</span>
              </div>
              <textarea
                value={csvContent}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  setDryRunResult(null);
                }}
                placeholder={`question_type,prompt_latex,option_a,option_b,option_c,option_d,correct_answer,explanation_latex\nMULTIPLE_CHOICE,"What is the derivative of $f(x) = x^2$?",$x$,$2x$,$x^2$,$2$,B,"Using the power rule: $\\frac{d}{dx}[x^n] = n x^{n-1}$, so $\\frac{d}{dx}[x^2] = 2x$."\nTRUE_FALSE,"In macroeconomic equilibrium, aggregate supply equals aggregate demand.",True,False,,,TRUE,"In equilibrium, total output supplied equals total output demanded."`}
                rows={10}
                style={{
                  width: '100%',
                  padding: SPACING.md,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.background,
                  color: tokens.textPrimary,
                  fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: 12,
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>
          )}

          {/* Status / In-progress Indicator */}
          {isProcessing && statusMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.sm,
                padding: SPACING.md,
                borderRadius: RADIUS.md,
                backgroundColor: tokens.surfaceSubtle,
                color: tokens.primary,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  border: '2px solid currentColor',
                  borderRightColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              {statusMessage}
            </div>
          )}

          {/* Validation Dry Run Results Card */}
          {dryRunResult && (
            <div
              style={{
                padding: SPACING.md,
                borderRadius: RADIUS.md,
                backgroundColor: dryRunResult.valid ? tokens.successBg || '#ECFDF5' : tokens.dangerBg || '#FEF2F2',
                border: `1px solid ${dryRunResult.valid ? tokens.success : tokens.danger}`,
                display: 'flex',
                flexDirection: 'column',
                gap: SPACING.sm,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
                {dryRunResult.valid ? (
                  <CheckCircle2 size={18} color={tokens.success} />
                ) : (
                  <AlertCircle size={18} color={tokens.danger} />
                )}
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: dryRunResult.valid ? tokens.success : tokens.danger,
                  }}
                >
                  {dryRunResult.valid
                    ? `✓ Dry run passed: All ${dryRunResult.validRowsCount} questions validated successfully and are ready to commit.`
                    : `✗ Validation failed: Found ${dryRunResult.errors.length} error(s) in CSV file.`}
                </div>
              </div>

              {dryRunResult.errors.length > 0 && (
                <div
                  style={{
                    maxHeight: 180,
                    overflowY: 'auto',
                    backgroundColor: tokens.surface,
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${tokens.border}`,
                    padding: SPACING.sm,
                  }}
                >
                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${tokens.border}`, color: tokens.textMuted }}>
                        <th style={{ padding: '4px 8px', width: 60 }}>Row</th>
                        <th style={{ padding: '4px 8px', width: 120 }}>Column</th>
                        <th style={{ padding: '4px 8px' }}>Error Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dryRunResult.errors.map((err, idx) => (
                        <tr key={idx} style={{ borderBottom: `1px solid ${tokens.surfaceSubtle}` }}>
                          <td style={{ padding: '4px 8px', fontWeight: 600, color: tokens.danger }}>
                            #{err.rowNumber}
                          </td>
                          <td style={{ padding: '4px 8px', color: tokens.textMuted, fontFamily: 'monospace' }}>
                            {err.column}
                          </td>
                          <td style={{ padding: '4px 8px', color: tokens.danger }}>
                            {err.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Quick Guidance / Format Info */}
          <div
            style={{
              padding: SPACING.md,
              borderRadius: RADIUS.md,
              backgroundColor: tokens.surfaceSubtle,
              border: `1px solid ${tokens.border}`,
              fontSize: 12,
              color: tokens.textMuted,
              display: 'flex',
              gap: SPACING.sm,
              lineHeight: 1.5,
            }}
          >
            <Info size={16} style={{ flexShrink: 0, marginTop: 2, color: tokens.primary }} />
            <div>
              <strong>CSV Formatting Tips:</strong> Use double quotes for cells containing commas or newlines (e.g. LaTeX equations <code>$\frac&#123;a&#125;&#123;b&#125;$</code>). Supported question types: <code>MULTIPLE_CHOICE</code> (answers: A, B, C, D), <code>TRUE_FALSE</code> (answers: TRUE, FALSE), and <code>SHORT_ANSWER</code> (pipe-separated answers: <code>Ans1|Ans2</code>).
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: `${SPACING.md}px ${SPACING.xl}px`,
            borderTop: `1px solid ${tokens.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: tokens.surfaceSubtle,
          }}
        >
          <div style={{ fontSize: 12, color: tokens.textMuted }}>
            {csvContent.trim().length > 0 && !dryRunResult?.valid && (
              <span>Dry run validation is required before committing to database.</span>
            )}
            {dryRunResult?.valid && (
              <span style={{ color: tokens.success, fontWeight: 600 }}>
                Ready to commit {dryRunResult.validRowsCount} question(s).
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: SPACING.md }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              style={{
                padding: '8px 18px',
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
                fontWeight: 500,
                fontSize: 13,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 20px',
                  borderRadius: RADIUS.md,
                  border: 'none',
                  backgroundColor: tokens.primary,
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: csvContent.trim().length === 0 || isProcessing ? 'not-allowed' : 'pointer',
                  opacity: csvContent.trim().length === 0 || isProcessing ? 0.6 : 1,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                {isProcessing ? 'Validating...' : 'Validate CSV (Dry Run)'}
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCommit}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 22px',
                  borderRadius: RADIUS.md,
                  border: 'none',
                  backgroundColor: tokens.success,
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                {isProcessing ? 'Importing Questions...' : `Commit ${dryRunResult.validRowsCount} Questions`}
                <CheckCircle2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
