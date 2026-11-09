'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Plus,
  Eye,
  Search,
  BookOpen,
  Paperclip,
  X,
  Scan,
  Layers,
} from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';
import {
  CatalogCourseDto,
  CatalogProgramDto,
  CatalogUniversityDto,
  MaterialType,
} from '@mastera/contracts';
import { StudentSimulatorModal } from '@/components/shared/StudentSimulatorModal';
import { adminApiFetch } from '@/lib/api-client';

const MATERIAL_TABS = [
  { key: 'modules', category: 'MODULES' as MaterialType, label: 'Modules' },
  { key: 'notes', category: 'NOTES' as MaterialType, label: 'Notes' },
  { key: 'amharic-notes', category: 'AMHARIC_NOTE' as MaterialType, label: 'Amharic Notes' },
] as const;

function MaterialAuthoringView(): React.ReactElement {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const tokens = ADMIN_THEMES.light;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialChapterId = searchParams.get('chapterId') || '';
  const initialCourseId = searchParams.get('courseId') || '';

  const rawParam = (routeParams?.materialType as string) || 'modules';
  const activeTab = useMemo(() => {
    const found = MATERIAL_TABS.find((t) => t.key === rawParam);
    return found || MATERIAL_TABS[0];
  }, [rawParam]);

  // Catalog state
  const [courses, setCourses] = useState<CatalogCourseDto[]>([]);
  const [universities, setUniversities] = useState<CatalogUniversityDto[]>([]);
  const [programs, setPrograms] = useState<CatalogProgramDto[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  // Material sets (BookGroup) state for course + category
  const [bookGroups, setBookGroups] = useState<any[]>([]);
  const [selectedBookGroupId, setSelectedBookGroupId] = useState<string>('');
  const [isAddingBookGroup, setIsAddingBookGroup] = useState(false);
  const [newBookGroupTitle, setNewBookGroupTitle] = useState('');
  const [isSubmittingBookGroup, setIsSubmittingBookGroup] = useState(false);

  // Chapters state for selected course, material category, and bookGroup
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>(initialChapterId);
  const [chapterFilter, setChapterFilter] = useState('');
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [isSubmittingChapter, setIsSubmittingChapter] = useState(false);

  // Chapter editing fields
  const [chapterTitle, setChapterTitle] = useState('');
  const [bodyMarkdownLatex, setBodyMarkdownLatex] = useState('');
  const [pdfStorageKey, setPdfStorageKey] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isFree, setIsFree] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [packageSummary, setPackageSummary] = useState<any | null>(null);
  const [isCompilingPackage, setIsCompilingPackage] = useState(false);

  // 1. Load catalog courses, universities, programs
  useEffect(() => {
    async function loadCatalog() {
      try {
        const [courseRes, univRes, progRes] = await Promise.all([
          adminApiFetch<{ items: CatalogCourseDto[] }>('/catalog/courses'),
          adminApiFetch<{ items: CatalogUniversityDto[] }>('/catalog/universities'),
          adminApiFetch<{ items: CatalogProgramDto[] }>('/catalog/programs'),
        ]);
        const items = courseRes?.items || [];
        setCourses(items);
        setUniversities(univRes?.items || []);
        setPrograms(progRes?.items || []);
        if (items.length > 0 && !selectedCourseId) {
          const defaultCourse = initialCourseId
            ? items.find((c) => c.id === initialCourseId) || items[0]
            : items[0];
          if (defaultCourse) {
            setSelectedCourseId(defaultCourse.id);
          }
        }
      } catch (err) {
        console.error('Failed to load courses catalog:', err);
      } finally {
        setIsLoadingCatalog(false);
      }
    }
    loadCatalog();
  }, [initialCourseId, selectedCourseId]);

  // 2. Load Material Sets (BookGroups) for selected course + category
  useEffect(() => {
    let isCancelled = false;
    async function loadBookGroups() {
      if (!selectedCourseId) return;
      try {
        const res = await adminApiFetch<any[]>(
          `/content/book-groups?courseId=${selectedCourseId}&category=${activeTab.category}`
        );
        if (isCancelled) return;
        const list = Array.isArray(res) ? res : [];
        setBookGroups(list);
        if (list.length > 0) {
          setSelectedBookGroupId(list[0].id);
        } else {
          setSelectedBookGroupId('');
        }
      } catch (err) {
        console.error('Failed to load material sets:', err);
      }
    }
    loadBookGroups();
    return () => {
      isCancelled = true;
    };
  }, [selectedCourseId, activeTab.category]);

  // 3. Load chapters for selected course, category, and bookGroupId
  useEffect(() => {
    let isCancelled = false;
    async function loadChapters() {
      if (!selectedCourseId) return;
      try {
        let url = `/content/chapters?courseId=${selectedCourseId}&category=${activeTab.category}`;
        if (selectedBookGroupId) {
          url += `&bookGroupId=${selectedBookGroupId}`;
        }
        const res = await adminApiFetch<any[]>(url);
        if (isCancelled) return;
        const list = Array.isArray(res) ? res : [];
        setChapters(list);

        if (list.length > 0) {
          if (initialChapterId && list.some((c) => c.id === initialChapterId)) {
            setSelectedChapterId(initialChapterId);
          } else {
            setSelectedChapterId(list[0].id);
          }
        } else {
          setSelectedChapterId('');
          setChapterTitle('');
          setBodyMarkdownLatex('');
          setPdfStorageKey(null);
          setPdfPreviewUrl(null);
          setIsFree(false);
        }
      } catch (err) {
        console.error('Failed to load chapters for material:', err);
      }
    }
    loadChapters();
    return () => {
      isCancelled = true;
    };
  }, [selectedCourseId, activeTab.category, selectedBookGroupId, initialChapterId]);

  // 4. When selected chapter changes, populate the editor fields
  const currentChapter = useMemo(
    () => chapters.find((c) => c.id === selectedChapterId),
    [chapters, selectedChapterId]
  );

  useEffect(() => {
    if (currentChapter) {
      setChapterTitle(currentChapter.title || '');
      setBodyMarkdownLatex(currentChapter.bodyMarkdownLatex || '');
      setPdfStorageKey(currentChapter.pdfStorageKey || null);
      setPdfPreviewUrl(null);
      setIsFree(Boolean(currentChapter.isFree));
    }
  }, [currentChapter]);

  // Load heavy content package summary for the selected course
  useEffect(() => {
    let isCancelled = false;
    async function loadPackageSummary() {
      if (!selectedCourseId) return;
      try {
        const res = await adminApiFetch<any>(
          `/content/packages/summary/${selectedCourseId}`
        );
        if (isCancelled) return;
        setPackageSummary(res);
      } catch {
        if (!isCancelled) setPackageSummary(null);
      }
    }
    loadPackageSummary();
    return () => {
      isCancelled = true;
    };
  }, [selectedCourseId]);

  const handleCompilePackage = async () => {
    if (!selectedCourseId) return;
    setIsCompilingPackage(true);
    try {
      const res = await adminApiFetch<any>(
        `/content/packages/generate/${selectedCourseId}`,
        {
          method: 'POST',
          body: {
            auditReason: 'Admin manually compiled offline package',
          },
        }
      );
      setPackageSummary({
        courseId: selectedCourseId,
        version: res?.contentVersion,
        sizeBytes: res?.sizeBytes,
        sha256Hex: res?.sha256Checksum,
        downloadUrl: res?.downloadUrl,
        isReady: true,
      });
      const sizeMb = ((res?.sizeBytes || 0) / (1024 * 1024)).toFixed(2);
      alert(
        `Offline content package v${res?.contentVersion} successfully compiled (${sizeMb} MB) and stored in MinIO storage!`
      );
    } catch (err: any) {
      alert(`Failed to compile package: ${err?.message || 'Server error'}`);
    } finally {
      setIsCompilingPackage(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedUniv = universities.find((u) => u.id === selectedCourse?.universityId);
  const selectedProg = programs.find((p) => p.id === selectedCourse?.programId);
  const selectedBookGroup = bookGroups.find((bg) => bg.id === selectedBookGroupId);

  const filteredChapters = useMemo(() => {
    if (!chapterFilter.trim()) return chapters;
    const term = chapterFilter.toLowerCase();
    return chapters.filter(
      (ch) =>
        (ch.title && ch.title.toLowerCase().includes(term)) ||
        `chapter ${ch.orderIndex}`.includes(term)
    );
  }, [chapters, chapterFilter]);

  const handleTabClick = (tabKey: string) => {
    router.replace(`/content/materials/${tabKey}/new`);
  };

  const handleCreateBookGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookGroupTitle.trim() || !selectedCourseId) return;
    setIsSubmittingBookGroup(true);
    try {
      const created = await adminApiFetch<any>('/content/book-groups', {
        method: 'POST',
        body: {
          data: {
            courseId: selectedCourseId,
            category: activeTab.category,
            title: newBookGroupTitle.trim(),
            subtitle: `${selectedCourse?.title || ''} ${activeTab.label}`,
          },
        },
      });
      setBookGroups((prev) => [...prev, created]);
      setSelectedBookGroupId(created.id);
      setNewBookGroupTitle('');
      setIsAddingBookGroup(false);
      alert(`New material set "${created.title}" created successfully!`);
    } catch (err: any) {
      console.error('Failed to create book group:', err);
      alert(`Failed to create material set: ${err?.message || 'Server error'}`);
    } finally {
      setIsSubmittingBookGroup(false);
    }
  };

  const handleAddChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim() || !selectedCourseId) return;
    setIsSubmittingChapter(true);
    try {
      const nextOrder = chapters.length + 1;
      const created = await adminApiFetch<any>('/content/chapters', {
        method: 'POST',
        body: {
          data: {
            courseId: selectedCourseId,
            bookGroupId: selectedBookGroupId || undefined,
            category: activeTab.category,
            orderIndex: nextOrder,
            title: newChapterTitle.trim(),
            bodyMarkdownLatex: `# ${newChapterTitle.trim()}\n\nEnter chapter text notes or attach PDF below...`,
            isFree: false,
          },
        },
      });
      setChapters((prev) => [...prev, created]);
      setSelectedChapterId(created.id);
      setNewChapterTitle('');
      setIsAddingChapter(false);
    } catch (err: any) {
      console.error('Failed to create chapter:', err);
      alert(`Failed to create chapter: ${err?.message || 'Server error'}`);
    } finally {
      setIsSubmittingChapter(false);
    }
  };

  const handlePdfFileSelect = (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }
    const storageKey = `uploads/pdf/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    setPdfStorageKey(storageKey);
    try {
      const previewUrl = URL.createObjectURL(file);
      setPdfPreviewUrl(previewUrl);
    } catch (e) {
      console.error('Failed to create object URL for PDF preview:', e);
    }
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
    if (!selectedCourseId) {
      alert('Please select a course.');
      return;
    }
    if (!selectedChapterId) {
      alert(`Please add a chapter for ${activeTab.label} first by clicking '+ Add New Chapter'.`);
      return;
    }

    setIsSaving(true);
    try {
      await adminApiFetch(`/content/chapters/${selectedChapterId}`, {
        method: 'PUT',
        body: {
          data: {
            title: chapterTitle.trim() || currentChapter?.title || 'Untitled Chapter',
            bodyMarkdownLatex,
            pdfStorageKey,
            isFree,
          },
        },
      });

      setChapters((prev) =>
        prev.map((ch) =>
          ch.id === selectedChapterId
            ? {
                ...ch,
                title: chapterTitle.trim() || ch.title,
                bodyMarkdownLatex,
                pdfStorageKey,
                isFree,
              }
            : ch
        )
      );

      alert('Chapter draft saved successfully to database!');
    } catch (err: any) {
      console.error('Failed to save chapter draft:', err);
      alert(`Failed to save chapter draft: ${err?.message || 'Server error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedCourseId) {
      alert('Please select a course.');
      return;
    }
    if (!selectedChapterId) {
      alert(`Please add a chapter for ${activeTab.label} first by clicking '+ Add New Chapter'.`);
      return;
    }

    setIsSaving(true);
    try {
      await adminApiFetch(`/content/chapters/${selectedChapterId}`, {
        method: 'PUT',
        body: {
          data: {
            title: chapterTitle.trim() || currentChapter?.title || 'Untitled Chapter',
            bodyMarkdownLatex,
            pdfStorageKey,
            isFree,
          },
        },
      });

      const publishRes = await adminApiFetch<{
        chapter: any;
        package?: {
          contentVersion: number;
          sizeBytes: number;
          sha256Checksum: string;
        };
      }>(`/content/chapters/${selectedChapterId}/publish`, {
        method: 'POST',
      });

      const pkgInfo = publishRes?.package;
      if (pkgInfo) {
        const sizeMb = (pkgInfo.sizeBytes / (1024 * 1024)).toFixed(2);
        alert(
          `Chapter successfully published! Offline package v${pkgInfo.contentVersion} (${sizeMb} MB) compiled and synchronized to MinIO storage.`
        );
      } else {
        alert('Chapter successfully published and parent course content version bumped!');
      }
      router.push(`/content/materials/${activeTab.key}`);
    } catch (err: any) {
      console.error('Failed to publish chapter:', err);
      alert(`Failed to publish chapter: ${err?.message || 'Server error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      {/* Top Header Row with Back link */}
      <div>
        <Link
          href={`/content/materials/${activeTab.key}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: SPACING.xs,
            color: tokens.textMuted,
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 500,
            marginBottom: SPACING.sm,
          }}
        >
          <ArrowLeft size={16} />
          Back to Materials Management
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: SPACING.md,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: tokens.textPrimary,
                margin: 0,
              }}
            >
              Author Material
            </h1>

            {/* Course Selector Dropdown */}
            {courses.length > 0 && (
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 13,
                  fontWeight: 500,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                  maxWidth: 420,
                  textOverflow: 'ellipsis',
                }}
              >
                {courses.map((c) => {
                  const p = programs.find((pr) => pr.id === c.programId);
                  const u = universities.find((un) => un.id === c.universityId);
                  const label = `${c.title} (${c.code}) - ${p?.name || 'Department'} - ${
                    u?.shortName || u?.name || 'University'
                  }`;
                  return (
                    <option key={c.id} value={c.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: SPACING.xs,
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.primary,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <Eye size={15} />
              Review as student
            </button>

            {/* Package Compile / MinIO Status button */}
            <button
              type="button"
              disabled={isCompilingPackage || !selectedCourseId}
              onClick={handleCompilePackage}
              title={
                packageSummary?.isReady
                  ? `Package v${packageSummary.version} (${(packageSummary.sizeBytes / 1024 / 1024).toFixed(2)} MB) stored in MinIO`
                  : 'Compile offline .pkg archive for mobile synchronization'
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surfaceSubtle,
                color: tokens.textPrimary,
                fontWeight: 600,
                cursor: isCompilingPackage ? 'not-allowed' : 'pointer',
                fontSize: 12,
              }}
            >
              <Layers size={14} color={tokens.primary} />
              <span>
                {isCompilingPackage
                  ? 'Compiling .pkg...'
                  : packageSummary?.isReady
                  ? `Package v${packageSummary.version} (${(packageSummary.sizeBytes / 1024 / 1024).toFixed(1)} MB)`
                  : 'Compile .pkg'}
              </span>
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
                color: tokens.textPrimary,
                fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: 13,
              }}
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handlePublish}
              style={{
                padding: `${SPACING.sm}px ${SPACING.xl}px`,
                borderRadius: RADIUS.md,
                border: 'none',
                backgroundColor: tokens.primary,
                color: tokens.sidebarText,
                fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: 13,
              }}
            >
              {isSaving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      {/* Material Switcher Tabs: Modules | Notes | Amharic Notes */}
      <div style={{ display: 'flex', gap: SPACING.sm }}>
        {MATERIAL_TABS.map((tab) => {
          const isActive = tab.key === activeTab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabClick(tab.key)}
              style={{
                padding: `${SPACING.xs}px ${SPACING.xl}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${isActive ? tokens.primary : tokens.border}`,
                backgroundColor: isActive ? tokens.primary : tokens.surface,
                color: isActive ? tokens.sidebarText : tokens.primary,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Material Set (BookGroup) Selector: Allows Multiple Materials In One Course */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.md,
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
          borderRadius: RADIUS.md,
          padding: `${SPACING.sm}px ${SPACING.lg}px`,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs, color: tokens.textPrimary }}>
          <Layers size={16} color={tokens.primary} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Material Set:</span>
        </div>

        {bookGroups.length > 0 ? (
          <select
            value={selectedBookGroupId}
            onChange={(e) => setSelectedBookGroupId(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: RADIUS.sm,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surfaceSubtle,
              color: tokens.textPrimary,
              fontSize: 13,
              fontWeight: 500,
              minWidth: 260,
            }}
          >
            {bookGroups.map((bg) => (
              <option key={bg.id} value={bg.id}>
                {bg.title} ({bg.chaptersCount || 0} chapters)
              </option>
            ))}
          </select>
        ) : (
          <span style={{ fontSize: 12, color: tokens.textMuted }}>
            No material set created yet for this course. Click &apos;+ Add Material Set&apos; to create one.
          </span>
        )}

        {isAddingBookGroup ? (
          <form
            onSubmit={handleCreateBookGroupSubmit}
            style={{ display: 'inline-flex', alignItems: 'center', gap: SPACING.xs }}
          >
            <input
              type="text"
              autoFocus
              value={newBookGroupTitle}
              onChange={(e) => setNewBookGroupTitle(e.target.value)}
              placeholder={`e.g. ${activeTab.label} Vol 2, Lab Manual...`}
              style={{
                padding: '6px 10px',
                borderRadius: RADIUS.sm,
                border: `1px solid ${tokens.border}`,
                fontSize: 13,
                minWidth: 240,
                color: tokens.textPrimary,
                backgroundColor: tokens.surface,
              }}
            />
            <button
              type="submit"
              disabled={isSubmittingBookGroup}
              style={{
                padding: '6px 12px',
                borderRadius: RADIUS.sm,
                border: 'none',
                backgroundColor: tokens.primary,
                color: tokens.sidebarText,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isSubmittingBookGroup ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingBookGroup(false);
                setNewBookGroupTitle('');
              }}
              style={{
                padding: '6px 10px',
                borderRadius: RADIUS.sm,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingBookGroup(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              borderRadius: RADIUS.sm,
              border: `1px dashed ${tokens.border}`,
              backgroundColor: tokens.surface,
              color: tokens.primary,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            Add Material Set
          </button>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: SPACING.xl,
          alignItems: 'start',
        }}
      >
        {/* Left Column: Chapters Navigation */}
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.xs,
              marginBottom: SPACING.sm,
            }}
          >
            <BookOpen size={16} color={tokens.primary} />
            <span style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>
              Chapters
            </span>
          </div>

          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: tokens.textPrimary,
              marginBottom: SPACING.xs,
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.xs,
            }}
          >
            <FileText size={16} color={tokens.textMuted} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedCourse?.title || 'Selected Course'}
            </span>
          </div>

          {selectedBookGroup && (
            <div style={{ fontSize: 12, color: tokens.primary, fontWeight: 600, marginBottom: SPACING.md }}>
              Set: {selectedBookGroup.title}
            </div>
          )}

          <label
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: tokens.textMuted,
              marginBottom: SPACING.xs,
            }}
          >
            Search chapters
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.xs,
              padding: '6px 10px',
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              marginBottom: SPACING.lg,
            }}
          >
            <Search size={14} color={tokens.textMuted} />
            <input
              type="text"
              value={chapterFilter}
              onChange={(e) => setChapterFilter(e.target.value)}
              placeholder="Filter chapters..."
              style={{
                border: 'none',
                outline: 'none',
                fontSize: 13,
                width: '100%',
                backgroundColor: 'transparent',
                color: tokens.textPrimary,
              }}
            />
          </div>

          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: tokens.textMuted,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: SPACING.sm,
            }}
          >
            Chapters ({chapters.length})
          </div>

          {/* Chapters List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.xs,
              marginBottom: SPACING.lg,
              maxHeight: 380,
              overflowY: 'auto',
            }}
          >
            {filteredChapters.length === 0 ? (
              <div
                style={{
                  fontSize: 12,
                  color: tokens.textMuted,
                  padding: SPACING.md,
                  textAlign: 'center',
                  backgroundColor: tokens.surfaceSubtle,
                  borderRadius: RADIUS.md,
                  lineHeight: 1.5,
                }}
              >
                No chapters created yet for {selectedBookGroup?.title || activeTab.label}. Click &apos;+ Add New Chapter&apos; below to create one.
              </div>
            ) : (
              filteredChapters.map((ch) => {
                const isSelected = ch.id === selectedChapterId;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setSelectedChapterId(ch.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: SPACING.sm,
                      padding: `${SPACING.sm}px ${SPACING.md}px`,
                      borderRadius: RADIUS.md,
                      border: `1px solid ${isSelected ? tokens.primary : tokens.border}`,
                      backgroundColor: isSelected ? tokens.primary : tokens.surface,
                      color: isSelected ? tokens.sidebarText : tokens.textPrimary,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: RADIUS.sm,
                        backgroundColor: isSelected
                          ? 'rgba(255, 255, 255, 0.2)'
                          : tokens.surfaceSubtle,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileText
                        size={15}
                        color={isSelected ? tokens.sidebarText : tokens.primary}
                      />
                    </div>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        Chapter {ch.orderIndex}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          opacity: isSelected ? 0.85 : 0.65,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {ch.title || `${selectedCourse?.title} - Chapter ${ch.orderIndex}`}
                      </div>
                    </div>
                    {ch.pdfStorageKey && (
                      <Paperclip
                        size={14}
                        color={isSelected ? tokens.sidebarText : tokens.primary}
                        style={{ flexShrink: 0 }}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Add New Chapter Button & Inline Form */}
          {isAddingChapter ? (
            <form onSubmit={handleAddChapterSubmit} style={{ marginTop: SPACING.sm }}>
              <input
                type="text"
                autoFocus
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="e.g. Chapter 1: Introduction & Overview"
                style={{
                  width: '100%',
                  padding: SPACING.sm,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 13,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                  marginBottom: SPACING.xs,
                }}
              />
              <div style={{ display: 'flex', gap: SPACING.xs }}>
                <button
                  type="submit"
                  disabled={isSubmittingChapter}
                  style={{
                    flex: 1,
                    padding: `${SPACING.xs}px ${SPACING.sm}px`,
                    borderRadius: RADIUS.md,
                    border: 'none',
                    backgroundColor: tokens.primary,
                    color: tokens.sidebarText,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmittingChapter ? 'Adding...' : 'Add Chapter'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingChapter(false);
                    setNewChapterTitle('');
                  }}
                  style={{
                    padding: `${SPACING.xs}px ${SPACING.sm}px`,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingChapter(true)}
              style={{
                width: '100%',
                padding: SPACING.md,
                borderRadius: RADIUS.md,
                border: 'none',
                backgroundColor: tokens.primary,
                color: tokens.sidebarText,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: SPACING.xs,
              }}
            >
              <Plus size={16} />
              Add New Chapter
            </button>
          )}
        </div>

        {/* Right Column: Chapter Content Editor */}
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.xl,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.lg,
          }}
        >
          {/* Chapter Selector Dropdown & Free Trial Checkbox */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: SPACING.md }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: tokens.textPrimary,
                  marginBottom: SPACING.xs,
                }}
              >
                Chapter
              </label>
              <select
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 13,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                }}
              >
                {chapters.length === 0 ? (
                  <option value="">No chapters created yet (add one on left)</option>
                ) : (
                  chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      Chapter {ch.orderIndex}: {ch.title}
                    </option>
                  ))
                )}
              </select>
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
                paddingBottom: 8,
              }}
            >
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
              />
              Free trial
            </label>
          </div>

          {/* Chapter Title Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: tokens.textPrimary,
                marginBottom: SPACING.xs,
              }}
            >
              Chapter title
            </label>
            <input
              type="text"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              placeholder="e.g. Chapter 1: Foundations & Core Concepts"
              style={{
                width: '100%',
                padding: SPACING.md,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
                fontSize: 14,
              }}
            />
          </div>

          {/* Chapter Content Textarea */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: tokens.textPrimary,
                marginBottom: SPACING.xs,
              }}
            >
              Chapter content
            </label>
            <textarea
              rows={12}
              value={bodyMarkdownLatex}
              onChange={(e) => setBodyMarkdownLatex(e.target.value)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              placeholder="Enter chapter text notes or attach PDF below... Formulas use $...$ and preview offline."
              style={{
                width: '100%',
                padding: SPACING.md,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
                fontSize: 14,
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
            />

            {/* Attached PDF Badge */}
            {pdfStorageKey && (
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
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
                  <FileText size={18} color={tokens.primary} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>
                    {pdfStorageKey.split('/').pop()}
                  </span>
                  <span style={{ fontSize: 12, color: tokens.textMuted }}>
                    (PDF Attached)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPdfStorageKey(null);
                    setPdfPreviewUrl(null);
                  }}
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

            {/* Bottom Actions: Open scan to PDF & Attach PDF */}
            <div
              style={{
                display: 'flex',
                gap: SPACING.md,
                alignItems: 'center',
                marginTop: SPACING.md,
              }}
            >
              <Link
                href="/scan-to-pdf"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: SPACING.xs,
                  padding: `${SPACING.sm}px ${SPACING.lg}px`,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.primary}`,
                  backgroundColor: tokens.surface,
                  color: tokens.primary,
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: 'none',
                }}
              >
                <Scan size={15} />
                Open scan to PDF
              </Link>

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
      </div>

      {/* Simulator Modal for "Review as student" */}
      <StudentSimulatorModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={chapterTitle || currentChapter?.title || selectedCourse?.title || 'Chapter Preview'}
        chapterMarkdownLatex={bodyMarkdownLatex}
        pdfStorageKey={pdfStorageKey}
        pdfPreviewUrl={pdfPreviewUrl}
      />
    </div>
  );
}

export default function NewMaterialPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 24, color: ADMIN_THEMES.light.textMuted }}>
          Loading authoring studio...
        </div>
      }
    >
      <MaterialAuthoringView />
    </Suspense>
  );
}
