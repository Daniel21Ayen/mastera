import React, { useState, useRef, useMemo } from 'react';
import {
  CatalogCourseDto,
  CatalogProgramDto,
  CatalogUniversityDto,
} from '@mastera/contracts';
import {
  ADMIN_THEMES,
  RADIUS,
  SPACING,
  ThemeMode,
} from '@mastera/ui-tokens';
import {
  FileText,
  RotateCw,
  Crop as CropIcon,
  Trash2,
  Plus,
  Upload,
  CheckCircle2,
  Paperclip,
} from 'lucide-react';

export type WizardStep = 1 | 2 | 3 | 4;

export type ScanCategoryOption =
  | 'Modules'
  | 'Notes'
  | 'Amharic Notes'
  | 'Quiz 1'
  | 'Quiz 2'
  | 'Quiz 3'
  | 'Mid Exam'
  | 'Final Exam'
  | 'Mock Exam'
  | 'COC Exam';

export interface ScannedImageItem {
  id: string;
  label: string;
  file?: File | undefined;
  previewUrl: string;
  rotation: 0 | 90 | 180 | 270;
  isCropZoomed?: boolean;
}

export interface ScanToPdfWizardProps {
  courses: CatalogCourseDto[];
  universities?: CatalogUniversityDto[] | undefined;
  programs?: CatalogProgramDto[] | undefined;
  onPublishPdf: (summary: {
    category: ScanCategoryOption;
    courseId?: string | undefined;
    programId?: string | undefined;
    universityId?: string | undefined;
    chapter?: string | undefined;
    year?: string | undefined;
    allowedTimeMins?: string | undefined;
    answerDescription?: string | undefined;
    pageCount: number;
    access: 'PAID_COURSE_ONLY' | 'FREE_TRIAL';
  }) => void;
  themeMode?: ThemeMode | undefined;
}

export function ScanToPdfWizard({
  courses,
  universities = [],
  programs = [],
  onPublishPdf,
  themeMode = 'light',
}: ScanToPdfWizardProps): React.ReactElement {
  const [step, setStep] = useState<WizardStep>(1);
  const [images, setImages] = useState<ScannedImageItem[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // Category selection (10 options matching admindesign 11 screenshots)
  const [category, setCategory] = useState<ScanCategoryOption>('Modules');

  // Filter dropdowns
  const [filterSemester, setFilterSemester] = useState<string>('ALL');
  const [filterStream, setFilterStream] = useState<string>('ALL');

  // Selected course (for non-COC categories)
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id ?? ''
  );

  // Chapter (for Modules, Notes, Amharic Notes)
  const [selectedChapter, setSelectedChapter] = useState<string>('Chapter 1');

  // Assessment details (Quizzes, Mid, Final, Mock, COC)
  const [answerMode, setAnswerMode] = useState<'TEXT' | 'FILE'>('TEXT');
  const [answerText, setAnswerText] = useState<string>('');
  const [answerFileName, setAnswerFileName] = useState<string | null>(null);
  const [allowedTime, setAllowedTime] = useState<string>('120 mins');
  const [examYear, setExamYear] = useState<string>('2026');

  // COC specific fields (NO Course filtration)
  const [cocUniversity, setCocUniversity] = useState<string>('ALL');
  const [cocProgram, setCocProgram] = useState<string>(programs[0]?.id || 'ALL');
  const [cocSemester, setCocSemester] = useState<string>('Semester 1');
  const [cocStream, setCocStream] = useState<string>('Common Courses');

  // Access
  const [access, setAccess] = useState<'PAID_COURSE_ONLY' | 'FREE_TRIAL'>(
    'PAID_COURSE_ONLY'
  );

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const answerFileInputRef = useRef<HTMLInputElement>(null);

  const tokens = ADMIN_THEMES[themeMode];

  // Filter courses based on semester and stream
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (filterSemester !== 'ALL' && c.semester !== Number(filterSemester)) {
        return false;
      }
      if (filterStream !== 'ALL' && c.stream !== filterStream) {
        return false;
      }
      return true;
    });
  }, [courses, filterSemester, filterStream]);

  // Ensure selectedCourseId points to a valid filtered course
  const currentSelectedCourseId = useMemo(() => {
    if (filteredCourses.some((c) => c.id === selectedCourseId)) {
      return selectedCourseId;
    }
    return filteredCourses[0]?.id || courses[0]?.id || '';
  }, [filteredCourses, selectedCourseId, courses]);

  const selectedCourse = courses.find((c) => c.id === currentSelectedCourseId);
  const estimatedSizeKB = images.length * 173;

  // Selected item object
  const currentSelectedImage = useMemo(() => {
    return images.find((img) => img.id === selectedImageId) || images[0] || null;
  }, [images, selectedImageId]);

  // Handle file selection from local filesystem
  const handleFilesChosen = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;

    const newItems: ScannedImageItem[] = [];
    Array.from(files).forEach((file, idx) => {
      const isPdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImg = file.type.startsWith('image/');

      if (isPdf || isImg) {
        const objectUrl = URL.createObjectURL(file);
        newItems.push({
          id: `scan-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
          label: file.name,
          file,
          previewUrl: objectUrl,
          rotation: 0,
        });
      }
    });

    if (newItems.length > 0) {
      setImages((prev) => [...prev, ...newItems]);
      if (!selectedImageId) {
        setSelectedImageId(newItems[0]?.id ?? null);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesChosen(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnZone = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFilesChosen(e.dataTransfer.files);
    }
  };

  // Rotate selected image by 90 degrees
  const handleRotate = () => {
    if (!currentSelectedImage) return;
    setImages((prev) =>
      prev.map((item) =>
        item.id === currentSelectedImage.id
          ? {
              ...item,
              rotation: (((item.rotation + 90) % 360) as 0 | 90 | 180 | 270),
            }
          : item
      )
    );
  };

  // Toggle crop/zoom fit on selected image
  const handleCrop = () => {
    if (!currentSelectedImage) return;
    setImages((prev) =>
      prev.map((item) =>
        item.id === currentSelectedImage.id
          ? { ...item, isCropZoomed: !item.isCropZoomed }
          : item
      )
    );
  };

  // Delete selected image
  const handleDelete = () => {
    if (!currentSelectedImage) return;
    const remaining = images.filter((img) => img.id !== currentSelectedImage.id);
    setImages(remaining);
    if (remaining.length > 0) {
      setSelectedImageId(remaining[0]?.id ?? null);
    } else {
      setSelectedImageId(null);
    }
  };

  // Drag and drop reordering between tiles
  const handleItemDragStart = (idx: number) => {
    setDraggedIndex(idx);
  };

  const handleItemDrop = (targetIdx: number) => {
    if (draggedIndex === null || draggedIndex === targetIdx) return;
    setImages((prev) => {
      const copy = [...prev];
      const moved = copy[draggedIndex];
      if (!moved) return prev;
      copy.splice(draggedIndex, 1);
      copy.splice(targetIdx, 0, moved);
      return copy;
    });
    setDraggedIndex(null);
  };

  const isMaterialCategory =
    category === 'Modules' || category === 'Notes' || category === 'Amharic Notes';
  const isQuizCategory =
    category === 'Quiz 1' || category === 'Quiz 2' || category === 'Quiz 3';
  const isMidOrFinal = category === 'Mid Exam' || category === 'Final Exam';
  const isMock = category === 'Mock Exam';
  const isCoc = category === 'COC Exam';

  return (
    <div>
      {/* Hidden File Input for Image Selection */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,application/pdf"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* Hidden File Input for Answer Document */}
      <input
        ref={answerFileInputRef}
        type="file"
        accept=".pdf,application/pdf,image/*,.doc,.docx"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setAnswerFileName(f.name);
          }
          if (answerFileInputRef.current) {
            answerFileInputRef.current.value = '';
          }
        }}
      />

      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.lg,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: tokens.textPrimary }}>
          Scan to PDF
        </h1>
        <button
          type="button"
          onClick={() => {
            setImages([]);
            setSelectedImageId(null);
            setStep(1);
          }}
          style={{
            padding: `${SPACING.xs}px ${SPACING.md}px`,
            borderRadius: RADIUS.md,
            border: `1px solid ${tokens.border}`,
            backgroundColor: tokens.surface,
            color: tokens.textPrimary,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Reset / Clear Stored Scans
        </button>
      </div>

      {/* 4-Step Pill Header (1 Import | 2 Order and edit | 3 Convert | 4 Publish) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: SPACING.sm,
          marginBottom: SPACING.xl,
        }}
      >
        {[
          { num: 1, label: '1 Import' },
          { num: 2, label: '2 Order and edit' },
          { num: 3, label: '3 Convert' },
          { num: 4, label: '4 Publish' },
        ].map((s) => {
          const isActive = step === s.num;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num <= step || images.length > 0) {
                  setStep(s.num as WizardStep);
                }
              }}
              style={{
                padding: `${SPACING.md}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: 'none',
                backgroundColor: isActive ? tokens.primary : tokens.surfaceSubtle,
                color: isActive ? tokens.sidebarText : tokens.textPrimary,
                fontWeight: isActive ? 700 : 500,
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: 14,
                transition: 'background-color 0.2s',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* STEP 1: Import Images from Local Filesystem */}
      {step === 1 && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDropOnZone}
          style={{
            border: `2px dashed ${tokens.primary}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.xxl,
            textAlign: 'center',
            backgroundColor: tokens.surface,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: tokens.surfaceSubtle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Upload size={28} color={tokens.primary} />
          </div>

          <h3 style={{ marginTop: 0, fontSize: 18, color: tokens.textPrimary }}>
            Add the scanned pages
          </h3>
          <p style={{ color: tokens.textMuted, fontSize: 13, marginBottom: SPACING.xl }}>
            6 or more images are fully supported. Up to 200 per PDF.
          </p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: `${SPACING.sm}px ${SPACING.xxl}px`,
              borderRadius: RADIUS.md,
              border: 'none',
              backgroundColor: tokens.primary,
              color: tokens.sidebarText,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: SPACING.sm,
            }}
          >
            <Upload size={16} />
            Choose images
          </button>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: SPACING.xxl,
              borderTop: `1px solid ${tokens.border}`,
              paddingTop: SPACING.md,
            }}
          >
            <span style={{ color: tokens.textMuted, fontSize: 13 }}>
              {images.length} images added
            </span>
            <button
              type="button"
              disabled={images.length === 0}
              onClick={() => {
                if (images.length > 0) {
                  if (!selectedImageId) {
                    setSelectedImageId(images[0]?.id ?? null);
                  }
                  setStep(2);
                }
              }}
              style={{
                padding: `${SPACING.sm}px ${SPACING.xl}px`,
                borderRadius: RADIUS.md,
                border: 'none',
                backgroundColor: tokens.primary,
                color: tokens.sidebarText,
                fontWeight: 600,
                fontSize: 14,
                opacity: images.length === 0 ? 0.5 : 1,
                cursor: images.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Next: order and edit
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Order and Edit + PDF details sidebar (Exact design from 11 screenshots) */}
      {step === 2 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.45fr 1fr',
            gap: SPACING.xl,
            alignItems: 'start',
          }}
        >
          {/* LEFT: Images grid with drag to reorder and action toolbar */}
          <div
            style={{
              backgroundColor: tokens.surface,
              border: `1px solid ${tokens.border}`,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
            }}
          >
            {/* Toolbar header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: SPACING.md,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14, color: tokens.textPrimary }}>
                {images.length} images · drag to reorder
              </div>
              <div style={{ display: 'flex', gap: SPACING.sm }}>
                <button
                  type="button"
                  onClick={handleRotate}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCw size={14} />
                  Rotate
                </button>
                <button
                  type="button"
                  onClick={handleCrop}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <CropIcon size={14} />
                  Crop
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.danger,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>

            {/* Grid of image cards (4 columns, portrait aspect ratio) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: SPACING.md,
              }}
            >
              {images.map((img, idx) => {
                const isSelected = img.id === (currentSelectedImage?.id ?? '');
                const isPdf =
                  img.file?.type === 'application/pdf' ||
                  img.label.toLowerCase().endsWith('.pdf');

                return (
                  <div
                    key={img.id}
                    draggable
                    onDragStart={() => handleItemDragStart(idx)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleItemDrop(idx)}
                    onClick={() => setSelectedImageId(img.id)}
                    style={{
                      position: 'relative',
                      height: 160,
                      borderRadius: RADIUS.md,
                      border: isSelected
                        ? `2px solid ${tokens.primary}`
                        : `1.5px dashed ${tokens.primary}`,
                      backgroundColor: tokens.surface,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'grab',
                      boxShadow: isSelected
                        ? `0 0 0 2px ${tokens.surfaceSubtle}`
                        : 'none',
                    }}
                  >
                    {/* Top-left circular blue number badge matching screenshot: "1", "2"... */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        backgroundColor: tokens.primary,
                        color: tokens.sidebarText,
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                      }}
                    >
                      {idx + 1}
                    </div>

                    {/* Image thumbnail or PDF Doc icon */}
                    {isPdf ? (
                      <div style={{ textAlign: 'center', padding: SPACING.xs }}>
                        <FileText size={32} color={tokens.primary} style={{ margin: '0 auto 4px' }} />
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: tokens.textPrimary,
                          }}
                        >
                          PDF Doc
                        </div>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img.previewUrl}
                        alt={img.label}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: img.isCropZoomed ? 'cover' : 'contain',
                          transform: `rotate(${img.rotation}deg)`,
                          transition: 'transform 0.2s',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* "+ Add more images" button */}
            <div style={{ textAlign: 'center', marginTop: SPACING.lg }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: tokens.primary,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Plus size={16} />
                Add more images
              </button>
            </div>
          </div>

          {/* RIGHT: PDF details Form matching ALL 11 screenshots */}
          <div
            style={{
              backgroundColor: tokens.surface,
              border: `1px solid ${tokens.border}`,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.md,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 700,
                color: tokens.textPrimary,
              }}
            >
              PDF details
            </h3>

            {/* Category Dropdown */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: tokens.textPrimary,
                  marginBottom: 4,
                }}
              >
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ScanCategoryOption)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                  fontSize: 13,
                }}
              >
                {(
                  [
                    'Modules',
                    'Notes',
                    'Amharic Notes',
                    'Quiz 1',
                    'Quiz 2',
                    'Quiz 3',
                    'Mid Exam',
                    'Final Exam',
                    'Mock Exam',
                    'COC Exam',
                  ] as const
                ).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 1. NON-COC Categories: Show Filter Semester & Stream + Course */}
            {!isCoc && (
              <>
                {/* Filter Semester & Filter Stream (Side by Side Grid) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: SPACING.md,
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 600,
                        color: tokens.textPrimary,
                        marginBottom: 4,
                      }}
                    >
                      Filter Semester
                    </label>
                    <select
                      value={filterSemester}
                      onChange={(e) => setFilterSemester(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: RADIUS.md,
                        border: `1px solid ${tokens.border}`,
                        backgroundColor: tokens.surface,
                        color: tokens.textPrimary,
                        fontSize: 13,
                      }}
                    >
                      <option value="ALL">All Semesters</option>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 600,
                        color: tokens.textPrimary,
                        marginBottom: 4,
                      }}
                    >
                      Filter Stream
                    </label>
                    <select
                      value={filterStream}
                      onChange={(e) => setFilterStream(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: RADIUS.md,
                        border: `1px solid ${tokens.border}`,
                        backgroundColor: tokens.surface,
                        color: tokens.textPrimary,
                        fontSize: 13,
                      }}
                    >
                      <option value="ALL">All Streams</option>
                      <option value="NATURAL">Natural</option>
                      <option value="SOCIAL">Social</option>
                    </select>
                  </div>
                </div>

                {/* Course (All Real Courses) */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: tokens.textPrimary,
                      marginBottom: 4,
                    }}
                  >
                    Course (All Real Courses)
                  </label>
                  <select
                    value={currentSelectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: RADIUS.md,
                      border: `1px solid ${tokens.border}`,
                      backgroundColor: tokens.surface,
                      color: tokens.textPrimary,
                      fontSize: 13,
                    }}
                  >
                    {filteredCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.code}] {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* 2. MATERIALS: Modules, Notes, Amharic Notes -> Chapter dropdown */}
            {isMaterialCategory && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: tokens.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  Chapter
                </label>
                <select
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                  }}
                >
                  <option value="Chapter 1">Chapter 1</option>
                  <option value="Chapter 2">Chapter 2</option>
                  <option value="Chapter 3">Chapter 3</option>
                  <option value="Chapter 4">Chapter 4</option>
                  <option value="Chapter 5">Chapter 5</option>
                  <option value="Chapter 6">Chapter 6</option>
                </select>
              </div>
            )}

            {/* 3. COC EXAM: University, Department, Semester, Stream, Year (NO Course) */}
            {isCoc && (
              <>
                {/* University */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: tokens.textPrimary,
                      marginBottom: 4,
                    }}
                  >
                    University
                  </label>
                  <select
                    value={cocUniversity}
                    onChange={(e) => setCocUniversity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: RADIUS.md,
                      border: `1px solid ${tokens.border}`,
                      backgroundColor: tokens.surface,
                      color: tokens.textPrimary,
                      fontSize: 13,
                    }}
                  >
                    <option value="ALL">All Universities</option>
                    {universities.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.shortName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department / Program */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: tokens.textPrimary,
                      marginBottom: 4,
                    }}
                  >
                    Department / Program
                  </label>
                  <select
                    value={cocProgram}
                    onChange={(e) => setCocProgram(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: RADIUS.md,
                      border: `1px solid ${tokens.border}`,
                      backgroundColor: tokens.surface,
                      color: tokens.textPrimary,
                      fontSize: 13,
                    }}
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                    {programs.length === 0 && (
                      <option value="Software Engineering">Software Engineering</option>
                    )}
                  </select>
                </div>

                {/* Semester */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: tokens.textPrimary,
                      marginBottom: 4,
                    }}
                  >
                    Semester
                  </label>
                  <select
                    value={cocSemester}
                    onChange={(e) => setCocSemester(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: RADIUS.md,
                      border: `1px solid ${tokens.border}`,
                      backgroundColor: tokens.surface,
                      color: tokens.textPrimary,
                      fontSize: 13,
                    }}
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                  </select>
                </div>

                {/* Stream */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: tokens.textPrimary,
                      marginBottom: 4,
                    }}
                  >
                    Stream
                  </label>
                  <select
                    value={cocStream}
                    onChange={(e) => setCocStream(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: RADIUS.md,
                      border: `1px solid ${tokens.border}`,
                      backgroundColor: tokens.surface,
                      color: tokens.textPrimary,
                      fontSize: 13,
                    }}
                  >
                    <option value="Common Courses">Common Courses</option>
                    <option value="Natural">Natural</option>
                    <option value="Social">Social</option>
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: tokens.textPrimary,
                      marginBottom: 4,
                    }}
                  >
                    Year
                  </label>
                  <select
                    value={examYear}
                    onChange={(e) => setExamYear(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: RADIUS.md,
                      border: `1px solid ${tokens.border}`,
                      backgroundColor: tokens.surface,
                      color: tokens.textPrimary,
                      fontSize: 13,
                    }}
                  >
                    {['2026', '2025', '2024', '2023', '2022'].map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* 4. ASSESSMENTS: Answer Description / Correct Answer with Type text & Attach file */}
            {(isQuizCategory || isMidOrFinal || isMock || isCoc) && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: tokens.textPrimary,
                    }}
                  >
                    {isMock ? 'Correct Answer' : 'Answer Description'}
                  </label>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setAnswerMode('TEXT')}
                      style={{
                        padding: '3px 10px',
                        borderRadius: RADIUS.sm,
                        border: `1px solid ${
                          answerMode === 'TEXT' ? tokens.primary : tokens.border
                        }`,
                        backgroundColor:
                          answerMode === 'TEXT' ? tokens.surfaceSubtle : tokens.surface,
                        color:
                          answerMode === 'TEXT' ? tokens.primary : tokens.textMuted,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Type text
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAnswerMode('FILE');
                        answerFileInputRef.current?.click();
                      }}
                      style={{
                        padding: '3px 10px',
                        borderRadius: RADIUS.sm,
                        border: `1px solid ${
                          answerMode === 'FILE' ? tokens.primary : tokens.border
                        }`,
                        backgroundColor:
                          answerMode === 'FILE' ? tokens.surfaceSubtle : tokens.surface,
                        color:
                          answerMode === 'FILE' ? tokens.primary : tokens.textMuted,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Attach file
                    </button>
                  </div>
                </div>

                {answerMode === 'TEXT' ? (
                  <textarea
                    rows={3}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Type answer explanations, solutions, or key..."
                    style={{
                      width: '100%',
                      padding: SPACING.sm,
                      borderRadius: RADIUS.md,
                      border: `1px solid ${tokens.border}`,
                      backgroundColor: tokens.surface,
                      color: tokens.textPrimary,
                      fontSize: 13,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      padding: SPACING.md,
                      borderRadius: RADIUS.md,
                      border: `1px dashed ${tokens.primary}`,
                      backgroundColor: tokens.surfaceSubtle,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
                      <Paperclip size={16} color={tokens.primary} />
                      <span style={{ fontSize: 13, color: tokens.textPrimary }}>
                        {answerFileName || 'No answer file selected'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => answerFileInputRef.current?.click()}
                      style={{
                        padding: '4px 10px',
                        borderRadius: RADIUS.sm,
                        border: `1px solid ${tokens.border}`,
                        backgroundColor: tokens.surface,
                        color: tokens.primary,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Browse
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 5. YEAR (Only for Mid Exam and Final Exam - NOT for Mock or Quizzes or Materials) */}
            {isMidOrFinal && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: tokens.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  Year
                </label>
                <select
                  value={examYear}
                  onChange={(e) => setExamYear(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                  }}
                >
                  {['2026', '2025', '2024', '2023', '2022', '2021', '2020'].map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 6. ALLOWED TIME (For Quizzes, Mid Exam, Final Exam, Mock Exam, COC Exam) */}
            {(isQuizCategory || isMidOrFinal || isMock || isCoc) && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: tokens.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  Allowed Time
                </label>
                <select
                  value={allowedTime}
                  onChange={(e) => setAllowedTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                  }}
                >
                  <option value="120 mins">120 mins</option>
                  <option value="90 mins">90 mins</option>
                  <option value="60 mins">60 mins</option>
                  <option value="45 mins">45 mins</option>
                  <option value="30 mins">30 mins</option>
                  <option value="180 mins">180 mins</option>
                </select>
              </div>
            )}

            {/* 7. ACCESS (For All Categories) */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: tokens.textPrimary,
                  marginBottom: 4,
                }}
              >
                Access
              </label>
              <select
                value={access}
                onChange={(e) =>
                  setAccess(e.target.value as 'PAID_COURSE_ONLY' | 'FREE_TRIAL')
                }
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                  fontSize: 13,
                }}
              >
                <option value="PAID_COURSE_ONLY">Paid course only</option>
                <option value="FREE_TRIAL">Free trial</option>
              </select>
            </div>

            {/* Pages count info */}
            <div style={{ fontSize: 13, color: tokens.textMuted, marginTop: SPACING.xs }}>
              Pages: {images.length} · Order as shown
            </div>

            {/* Big Convert to one PDF button */}
            <button
              type="button"
              disabled={images.length === 0}
              onClick={() => setStep(3)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: RADIUS.md,
                border: 'none',
                backgroundColor: tokens.primary,
                color: tokens.sidebarText,
                fontWeight: 600,
                fontSize: 14,
                cursor: images.length === 0 ? 'not-allowed' : 'pointer',
                opacity: images.length === 0 ? 0.6 : 1,
                marginTop: SPACING.xs,
              }}
            >
              Convert to one PDF
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Convert Preview */}
      {step === 3 && (
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.xl,
            maxWidth: 640,
            margin: '0 auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
            <CheckCircle2 size={24} color={tokens.success} />
            <h3 style={{ margin: 0, fontSize: 18, color: tokens.textPrimary }}>
              PDF ready
            </h3>
          </div>

          <p style={{ fontSize: 13, color: tokens.textMuted, margin: '0 0 16px' }}>
            All {images.length} scanned pages have been ordered, rotated, and compiled into a single high-fidelity Mastera PDF textbook document.
          </p>

          <div style={{ display: 'flex', gap: SPACING.sm, marginBottom: SPACING.xl }}>
            <span
              style={{
                padding: `4px ${SPACING.md}px`,
                borderRadius: RADIUS.pill,
                backgroundColor: tokens.surfaceSubtle,
                color: tokens.primary,
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {images.length} pages
            </span>
            <span
              style={{
                padding: `4px ${SPACING.md}px`,
                borderRadius: RADIUS.pill,
                backgroundColor: tokens.surfaceSubtle,
                color: tokens.primary,
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {estimatedSizeKB} KB
            </span>
            <span
              style={{
                padding: `4px ${SPACING.md}px`,
                borderRadius: RADIUS.pill,
                backgroundColor: tokens.surfaceSubtle,
                color: tokens.primary,
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {category}
            </span>
          </div>

          <div style={{ display: 'flex', gap: SPACING.md, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.primary}`,
                backgroundColor: tokens.surface,
                color: tokens.primary,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Back to edit
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              style={{
                padding: `${SPACING.sm}px ${SPACING.xl}px`,
                borderRadius: RADIUS.md,
                border: 'none',
                backgroundColor: tokens.primary,
                color: tokens.sidebarText,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Continue to publish
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Publish Summary */}
      {step === 4 && (
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.xl,
            maxWidth: 640,
            margin: '0 auto',
          }}
        >
          <h3 style={{ marginTop: 0, fontSize: 18, color: tokens.textPrimary, marginBottom: SPACING.md }}>
            Publish
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              rowGap: SPACING.md,
              marginBottom: SPACING.lg,
              borderTop: `1px solid ${tokens.border}`,
              borderBottom: `1px solid ${tokens.border}`,
              padding: `${SPACING.md}px 0`,
              fontSize: 13,
            }}
          >
            <span style={{ color: tokens.textMuted }}>Title</span>
            <span style={{ textAlign: 'right', fontWeight: 600, color: tokens.textPrimary }}>
              {isCoc
                ? `COC Exam · ${cocProgram}`
                : `${selectedCourse?.title ?? 'Course'} · ${category}`}
            </span>

            <span style={{ color: tokens.textMuted }}>Category</span>
            <span style={{ textAlign: 'right', fontWeight: 600, color: tokens.textPrimary }}>
              {category}
            </span>

            {isMaterialCategory && (
              <>
                <span style={{ color: tokens.textMuted }}>Chapter</span>
                <span style={{ textAlign: 'right', fontWeight: 600, color: tokens.textPrimary }}>
                  {selectedChapter}
                </span>
              </>
            )}

            {(isQuizCategory || isMidOrFinal || isMock || isCoc) && (
              <>
                <span style={{ color: tokens.textMuted }}>Allowed Time</span>
                <span style={{ textAlign: 'right', fontWeight: 600, color: tokens.textPrimary }}>
                  {allowedTime}
                </span>
              </>
            )}

            {(isMidOrFinal || isCoc) && (
              <>
                <span style={{ color: tokens.textMuted }}>Year</span>
                <span style={{ textAlign: 'right', fontWeight: 600, color: tokens.textPrimary }}>
                  {examYear}
                </span>
              </>
            )}

            <span style={{ color: tokens.textMuted }}>Access</span>
            <span style={{ textAlign: 'right', fontWeight: 600, color: tokens.textPrimary }}>
              {access === 'PAID_COURSE_ONLY' ? 'Paid course only' : 'Free trial'}
            </span>

            <span style={{ color: tokens.textMuted }}>Pages</span>
            <span style={{ textAlign: 'right', fontWeight: 600, color: tokens.textPrimary }}>
              {images.length}
            </span>

            <span style={{ color: tokens.textMuted }}>Size</span>
            <span style={{ textAlign: 'right', fontWeight: 600, color: tokens.textPrimary }}>
              {estimatedSizeKB} KB
            </span>
          </div>

          <p style={{ fontSize: 13, color: tokens.textMuted, lineHeight: 1.5, margin: '0 0 20px' }}>
            Published PDFs inherit entitlement protection: only students with verified access can open, stream, or store them offline.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => setStep(3)}
              style={{
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.primary}`,
                backgroundColor: tokens.surface,
                color: tokens.primary,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Back
            </button>

            <button
              type="button"
              onClick={() => {
                alert(`PDF for ${category} successfully generated and published!`);
                onPublishPdf({
                  category,
                  courseId: selectedCourse?.id,
                  programId: cocProgram,
                  universityId: cocUniversity,
                  chapter: selectedChapter,
                  year: examYear,
                  allowedTimeMins: allowedTime,
                  answerDescription: answerText,
                  pageCount: images.length,
                  access,
                });
              }}
              style={{
                padding: `${SPACING.sm}px ${SPACING.xxl}px`,
                borderRadius: RADIUS.md,
                border: 'none',
                backgroundColor: tokens.primary,
                color: tokens.sidebarText,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Publish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
