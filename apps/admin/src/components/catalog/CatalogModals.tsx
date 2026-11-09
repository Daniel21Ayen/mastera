import React, { useState } from 'react';
import {
  AcademicStream,
  CatalogProgramDto,
  CatalogUniversityDto,
} from '@mastera/contracts';
import {
  ADMIN_THEMES,
  COURSE_ACCENT_NAMES,
  CourseAccentName,
  RADIUS,
  SPACING,
  ThemeMode,
} from '@mastera/ui-tokens';

export interface AddCourseModalSubmitPayload {
  universityId: string | null;
  programId: string | null;
  semester: 1 | 2;
  code: string;
  title: string;
  stream: AcademicStream;
  accent: CourseAccentName;
  icon: string;
  freeAccess: boolean;
  freeTrialCount: number;
  isActive: boolean;
}

export interface AddCourseModalProps {
  isOpen: boolean;
  universities: CatalogUniversityDto[];
  programs: CatalogProgramDto[];
  canEditCommercialFlags: boolean; // Super Admin only (Section 4.3)
  onClose: () => void;
  onSubmit: (payload: AddCourseModalSubmitPayload) => void;
  themeMode?: ThemeMode;
}

export function AddCourseModal({
  isOpen,
  universities,
  programs,
  canEditCommercialFlags,
  onClose,
  onSubmit,
  themeMode = 'light',
}: AddCourseModalProps): React.ReactElement | null {
  const [universityId, setUniversityId] = useState<string>('');
  const [programId, setProgramId] = useState<string>('');
  const [semester, setSemester] = useState<1 | 2>(1);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [stream, setStream] = useState<AcademicStream>('COMMON');
  const [accent, setAccent] = useState<CourseAccentName>('blue');
  const [icon, setIcon] = useState('book');
  const [freeAccess, setFreeAccess] = useState(false);
  const [freeTrialCount, setFreeTrialCount] = useState(0);
  const [isActive, setIsActive] = useState(false); // Default Inactive per screenshot

  if (!isOpen) return null;

  const tokens = ADMIN_THEMES[themeMode];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      universityId: universityId || null,
      programId: programId || null,
      semester,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      stream,
      accent,
      icon: icon.trim() || 'book',
      freeAccess,
      freeTrialCount: Math.max(0, Math.min(20, freeTrialCount)),
      isActive,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: tokens.surface,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl,
          width: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.md,
          border: `1px solid ${tokens.border}`,
        }}
      >
        <h2 style={{ margin: 0, color: tokens.textPrimary }}>Add course</h2>

        <label style={{ fontSize: 13, fontWeight: 600 }}>
          University
          <select
            value={universityId}
            onChange={(e) => setUniversityId(e.target.value)}
            style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
          >
            <option value="">All universities</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.shortName})
              </option>
            ))}
          </select>
        </label>

        <label style={{ fontSize: 13, fontWeight: 600 }}>
          Program / Department
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
          >
            <option value="">All programs</option>
            {programs
              .filter((p) => !universityId || p.universityId === universityId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>

        <label style={{ fontSize: 13, fontWeight: 600 }}>
          Semester
          <select
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value) as 1 | 2)}
            style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
          >
            <option value={1}>Semester 1</option>
            <option value={2}>Semester 2</option>
          </select>
        </label>

        <label style={{ fontSize: 13, fontWeight: 600 }}>
          Course code
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. ENG101"
            style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
          />
        </label>

        <label style={{ fontSize: 13, fontWeight: 600 }}>
          Course title
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Communicative English"
            style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
          />
        </label>

        <label style={{ fontSize: 13, fontWeight: 600 }}>
          Stream
          <select
            value={stream}
            onChange={(e) => setStream(e.target.value as AcademicStream)}
            style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
          >
            <option value="COMMON">Common</option>
            <option value="NATURAL">Natural</option>
            <option value="SOCIAL">Social</option>
          </select>
        </label>

        {/* D31 & Section 10.8: Select from the 8 named course accents */}
        <label style={{ fontSize: 13, fontWeight: 600 }}>
          Accent Colour
          <select
            value={accent}
            onChange={(e) => setAccent(e.target.value as CourseAccentName)}
            style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
          >
            {COURSE_ACCENT_NAMES.map((acc) => (
              <option key={acc} value={acc}>
                {acc.charAt(0).toUpperCase() + acc.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label style={{ fontSize: 13, fontWeight: 600 }}>
          Icon
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
          />
        </label>

        {canEditCommercialFlags && (
          <>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.sm,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={freeAccess}
                onChange={(e) => setFreeAccess(e.target.checked)}
              />
              Free Access (Course is 100% free to all students)
            </label>

            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Free trial items
              <input
                type="number"
                min={0}
                max={20}
                value={freeTrialCount}
                onChange={(e) => setFreeTrialCount(Number(e.target.value))}
                style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
              />
              <span
                style={{
                  display: 'block',
                  fontSize: 11,
                  color: tokens.textMuted,
                  marginTop: 2,
                }}
              >
                How many items of this course unpaid students can open. Use 0 for
                none (up to 20).
              </span>
            </label>
          </>
        )}

        <label style={{ fontSize: 13, fontWeight: 600 }}>
          Status
          <select
            value={isActive ? 'ACTIVE' : 'INACTIVE'}
            onChange={(e) => setIsActive(e.target.value === 'ACTIVE')}
            style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
          >
            <option value="INACTIVE">Inactive</option>
            <option value="ACTIVE">Active</option>
          </select>
        </label>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: SPACING.sm,
            marginTop: SPACING.md,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: `${SPACING.sm}px ${SPACING.lg}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.primary}`,
              backgroundColor: tokens.surface,
              color: tokens.primary,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: `${SPACING.sm}px ${SPACING.lg}px`,
              borderRadius: RADIUS.md,
              border: 'none',
              backgroundColor: tokens.primary,
              color: tokens.sidebarText,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Add course
          </button>
        </div>
      </form>
    </div>
  );
}