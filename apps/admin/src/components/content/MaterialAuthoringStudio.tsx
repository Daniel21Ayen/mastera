'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  AdminRole,
  CatalogCourseDto,
  MaterialType,
} from '@mastera/contracts';
import {
  ACTIVE_NAVIGATION_TOKEN,
  ADMIN_THEMES,
  RADIUS,
  SPACING,
  ThemeMode,
} from '@mastera/ui-tokens';
import { Paperclip, FileText, X, Loader2 } from 'lucide-react';
import { StudentSimulatorModal } from '../shared/StudentSimulatorModal';
import { adminApiFetch } from '@/lib/api-client';

export interface MaterialStudioChapterDraft {
  id: string;
  orderIndex: number;
  title: string;
  bodyMarkdownLatex: string;
  pdfStorageKey?: string | null;
  isFreeTrial: boolean;
  status?: string;
}

export interface MaterialAuthoringStudioProps {
  courses: CatalogCourseDto[];
  actorRole: AdminRole;
  canPublish: boolean;
  initialCourseId?: string | undefined;
  initialTab?: MaterialType | undefined;
  initialChapterId?: string | undefined;
  onSaveChapterDraft: (
    courseId: string,
    category: MaterialType,
    chapter: MaterialStudioChapterDraft
  ) => Promise<string | void> | void;
  onPublishChapter: (
    courseId: string,
    category: MaterialType,
    chapter: MaterialStudioChapterDraft
  ) => Promise<void> | void;
  onOpenScanToPdf: () => void;
  themeMode?: ThemeMode | undefined;
}

export function MaterialAuthoringStudio({
  courses,
  canPublish,
  initialCourseId,
  initialTab = 'MODULES',
  initialChapterId,
  onSaveChapterDraft,
  onPublishChapter,
  onOpenScanToPdf,
  themeMode = 'light',
}: MaterialAuthoringStudioProps): React.ReactElement {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialCourseId || courses[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<MaterialType>(initialTab);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [chapters, setChapters] = useState<MaterialStudioChapterDraft[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tokens = ADMIN_THEMES[themeMode];

  // Fetch chapters for the current course and material tab
  useEffect(() => {
    let isCancelled = false;
    async function loadChapters() {
      if (!selectedCourseId) return;
      setIsLoadingChapters(true);
      try {
        const res = await adminApiFetch<any[]>(
          `/content/chapters?courseId=${selectedCourseId}&category=${activeTab}`
        );
        if (isCancelled) return;
        if (Array.isArray(res) && res.length > 0) {
          const mapped: MaterialStudioChapterDraft[] = res.map((ch) => ({
            id: ch.id,
            orderIndex: ch.orderIndex,
            title: ch.title || `Chapter ${ch.orderIndex}`,
            bodyMarkdownLatex: ch.bodyMarkdownLatex || '',
            pdfStorageKey: ch.pdfStorageKey || null,
            isFreeTrial: Boolean(ch.isFree),
            status: ch.status,
          }));
          setChapters(mapped);
          if (initialChapterId && mapped.some((c) => c.id === initialChapterId)) {
            setSelectedChapterId(initialChapterId);
          } else {
            setSelectedChapterId(mapped[0]?.id || '');
          }
        } else {
          // No chapters yet for this course & category - start with initial draft
          const initialDraft: MaterialStudioChapterDraft = {
            id: `draft-1-${Date.now()}`,
            orderIndex: 1,
            title: `Chapter 1: Foundations & Core Concepts`,
            bodyMarkdownLatex: '',
            pdfStorageKey: null,
            isFreeTrial: false,
          };
          setChapters([initialDraft]);
          setSelectedChapterId(initialDraft.id);
        }
      } catch (err) {
        console.error('Failed to load chapters for category:', err);
        if (!isCancelled && chapters.length === 0) {
          const fallbackDraft: MaterialStudioChapterDraft = {
            id: `draft-1-${Date.now()}`,
            orderIndex: 1,
            title: 'Chapter 1: Foundations & Core Concepts',
            bodyMarkdownLatex: '',
            pdfStorageKey: null,
            isFreeTrial: false,
          };
          setChapters([fallbackDraft]);
          setSelectedChapterId(fallbackDraft.id);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingChapters(false);
        }
      }
    }

    loadChapters();
    return () => {
      isCancelled = true;
    };
  }, [selectedCourseId, activeTab]);

  const currentChapter: MaterialStudioChapterDraft =
    chapters.find((c) => c.id === selectedChapterId) ??
    chapters[0] ?? {
      id: 'draft-default',
      orderIndex: 1,
      title: 'Chapter 1',
      bodyMarkdownLatex: '',
      pdfStorageKey: null,
      isFreeTrial: false,
    };

  const updateCurrentChapter = (
    patch: Partial<MaterialStudioChapterDraft>
  ) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === currentChapter.id ? { ...ch, ...patch } : ch
      )
    );
  };

  const handleAddNewChapter = () => {
    const nextOrder = chapters.length + 1;
    const newDraft: MaterialStudioChapterDraft = {
      id: `draft-${nextOrder}-${Date.now()}`,
      orderIndex: nextOrder,
      title: `Chapter ${nextOrder}`,
      bodyMarkdownLatex: '',
      pdfStorageKey: null,
      isFreeTrial: false,
    };
    setChapters((prev) => [...prev, newDraft]);
    setSelectedChapterId(newDraft.id);
  };

  const handlePdfFileSelect = (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }
    const storageKey = `uploads/pdf/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    updateCurrentChapter({
      pdfStorageKey: storageKey,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePdfFileSelect(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      handlePdfFileSelect(file);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const savedId = await onSaveChapterDraft(selectedCourseId, activeTab, currentChapter);
      if (savedId && typeof savedId === 'string' && currentChapter.id.startsWith('draft-')) {
        setChapters((prev) =>
          prev.map((ch) => (ch.id === currentChapter.id ? { ...ch, id: savedId } : ch))
        );
        setSelectedChapterId(savedId);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      await onPublishChapter(selectedCourseId, activeTab, currentChapter);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* Top Action Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.xl,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: tokens.textPrimary }}>
            Courses
          </h1>
          <span
            style={{
              padding: `4px ${SPACING.md}px`,
              borderRadius: RADIUS.pill,
              backgroundColor: tokens.surfaceSubtle,
              color: tokens.primary,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {currentChapter.status || 'Draft'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: SPACING.sm }}>
          <button
            type="button"
            onClick={() =>
              updateCurrentChapter({ title: '', bodyMarkdownLatex: '', pdfStorageKey: null })
            }
            style={{
              padding: `${SPACING.sm}px ${SPACING.lg}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Clear form
          </button>

          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            style={{
              padding: `${SPACING.sm}px ${SPACING.lg}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              color: tokens.primary,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Preview as student
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveDraft}
            style={{
              padding: `${SPACING.sm}px ${SPACING.lg}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              color: tokens.primary,
              fontWeight: 600,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? 'Saving...' : 'Save draft'}
          </button>

          {canPublish && (
            <button
              type="button"
              disabled={isSaving}
              onClick={handlePublish}
              style={{
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: 'none',
                backgroundColor: tokens.primary,
                color: tokens.sidebarText,
                fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              Publish
            </button>
          )}
        </div>
      </div>

      {/* Two-Column Studio Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: SPACING.xl,
        }}
      >
        {/* Left Column: Course & Chapter Selector */}
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            height: 'fit-content',
          }}
        >
          <label style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary, display: 'block' }}>
            Course
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              style={{
                width: '100%',
                padding: SPACING.sm,
                marginTop: SPACING.xs,
                marginBottom: SPACING.lg,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
              }}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: SPACING.sm,
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 13, color: tokens.textPrimary }}>
              Chapters ({chapters.length})
            </span>
            {isLoadingChapters && <Loader2 size={14} className="animate-spin" color={tokens.textMuted} />}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.xs,
              marginBottom: SPACING.md,
              maxHeight: 400,
              overflowY: 'auto',
            }}
          >
            {chapters.map((ch) => {
              const isSelected = ch.id === currentChapter.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedChapterId(ch.id)}
                  style={{
                    padding: SPACING.md,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${
                      isSelected ? ACTIVE_NAVIGATION_TOKEN : tokens.border
                    }`,
                    backgroundColor: isSelected
                      ? tokens.surfaceSubtle
                      : tokens.surface,
                    color: tokens.primary,
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ch.title || `Chapter ${ch.orderIndex}`}
                  </span>
                  {ch.pdfStorageKey && (
                    <Paperclip size={14} color={tokens.primary} style={{ flexShrink: 0, marginLeft: 4 }} />
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleAddNewChapter}
            style={{
              width: '100%',
              padding: SPACING.md,
              borderRadius: RADIUS.md,
              border: 'none',
              backgroundColor: tokens.primary,
              color: tokens.sidebarText,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Add New Chapter
          </button>
        </div>

        {/* Right Column: Material Tabs & Editor */}
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.xl,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: `1px solid ${tokens.border}`,
              paddingBottom: SPACING.md,
              marginBottom: SPACING.lg,
            }}
          >
            {/* Material tabs (Notes, Modules, Amharic Notes) */}
            <div style={{ display: 'flex', gap: SPACING.lg }}>
              {(
                [
                  { id: 'NOTES', label: 'Notes' },
                  { id: 'MODULES', label: 'Modules' },
                  { id: 'AMHARIC_NOTE', label: 'Amharic Notes' },
                ] as const
              ).map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderBottom: isActive
                        ? `3px solid ${ACTIVE_NAVIGATION_TOKEN}`
                        : '3px solid transparent',
                      color: isActive
                        ? ACTIVE_NAVIGATION_TOKEN
                        : tokens.textMuted,
                      fontWeight: 600,
                      paddingBottom: SPACING.xs,
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.xs,
                fontSize: 13,
                fontWeight: 600,
                color: tokens.textPrimary,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={currentChapter.isFreeTrial}
                onChange={(e) =>
                  updateCurrentChapter({ isFreeTrial: e.target.checked })
                }
              />
              Free trial
            </label>
          </div>

          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: tokens.textPrimary,
              marginBottom: SPACING.md,
            }}
          >
            Chapter title
            <input
              type="text"
              value={currentChapter.title}
              onChange={(e) => updateCurrentChapter({ title: e.target.value })}
              placeholder="e.g. Chapter 1: Foundations & Core Concepts"
              style={{
                width: '100%',
                padding: SPACING.md,
                marginTop: SPACING.xs,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
                fontSize: 14,
              }}
            />
          </label>

          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: tokens.textPrimary,
              marginBottom: SPACING.sm,
            }}
          >
            Chapter content
            <textarea
              rows={10}
              value={currentChapter.bodyMarkdownLatex}
              onChange={(e) =>
                updateCurrentChapter({ bodyMarkdownLatex: e.target.value })
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              placeholder="Enter chapter text notes or attach PDF below... Formulas use $...$ and preview offline."
              style={{
                width: '100%',
                padding: SPACING.md,
                marginTop: SPACING.xs,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
                fontFamily: 'inherit',
                fontSize: 14,
                lineHeight: 1.5,
              }}
            />
          </label>

          {/* Attached PDF Badge */}
          {currentChapter.pdfStorageKey && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                borderRadius: RADIUS.md,
                backgroundColor: tokens.surfaceSubtle,
                border: `1px solid ${tokens.border}`,
                marginTop: SPACING.sm,
                marginBottom: SPACING.md,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
                <FileText size={18} color={tokens.primary} />
                <span style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>
                  {currentChapter.pdfStorageKey.split('/').pop()}
                </span>
                <span style={{ fontSize: 12, color: tokens.textMuted }}>
                  (PDF Attached)
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateCurrentChapter({ pdfStorageKey: null })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: tokens.danger,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <X size={14} />
                Remove
              </button>
            </div>
          )}

          {/* Bottom Action Buttons: Open scan to PDF & Attach PDF */}
          <div
            style={{
              display: 'flex',
              gap: SPACING.md,
              alignItems: 'center',
              marginTop: SPACING.lg,
            }}
          >
            <button
              type="button"
              onClick={onOpenScanToPdf}
              style={{
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.primary}`,
                backgroundColor: tokens.surface,
                color: tokens.primary,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Open scan to PDF
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: SPACING.xs,
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <Paperclip size={16} />
              Attach PDF
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>

      <StudentSimulatorModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={currentChapter.title}
        chapterMarkdownLatex={currentChapter.bodyMarkdownLatex}
        themeMode={themeMode}
      />
    </div>
  );
}
