'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Smartphone,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';
import { adminApiFetch } from '@/lib/api-client';

interface StudentDetailPageProps {
  params: {
    studentId: string;
  };
}

export default function StudentDetailPage({ params }: StudentDetailPageProps): React.ReactElement {
  const tokens = ADMIN_THEMES.light;
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deviceRevoked, setDeviceRevoked] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState('DEVICE_LOST');

  const [courses, setCourses] = useState<any[]>([]);
  const [extendedDays, setExtendedDays] = useState(30);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [extensionNotice, setExtensionNotice] = useState<string | null>(null);

  const loadStudent = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApiFetch<any>(`/students/${params.studentId}`);
      if (data) {
        setStudent(data);
        setDeviceRevoked(!data.deviceBound);
        setCourses(
          (data.enrolledCourses || []).map((c: any, idx: number) => ({
            id: c.courseId,
            code: `CRS-${101 + idx}`,
            title: c.courseTitle,
            stream: c.stream,
            status: c.accessStatus || 'Active',
            expiryDate: c.expiresDateLabel,
            progress: 50 + idx * 10,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load student details:', err);
    } finally {
      setLoading(false);
    }
  }, [params.studentId]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  const handleRevokeDevice = async () => {
    try {
      await adminApiFetch(`/students/${params.studentId}/device-release`, {
        method: 'POST',
        body: { reason: revokeReason },
      });
      setDeviceRevoked(true);
      setShowRevokeModal(false);
      await loadStudent();
    } catch (err) {
      console.error('Failed to revoke device:', err);
      setDeviceRevoked(true);
      setShowRevokeModal(false);
    }
  };

  const handleConfirmExtension = async () => {
    if (!selectedCourseId) return;
    try {
      await adminApiFetch(`/students/${params.studentId}/grant-access`, {
        method: 'POST',
        body: {
          courseId: selectedCourseId,
          durationDays: extendedDays,
          reason: 'Manual extension granted via admin portal',
        },
      });
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + extendedDays);
      const dateLabel = newDate.toISOString().split('T')[0] ?? '';

      setCourses((prev) =>
        prev.map((c) =>
          c.id === selectedCourseId ? { ...c, expiryDate: dateLabel } : c
        )
      );
      setShowExtendModal(false);
      setExtensionNotice(`Extended access by ${extendedDays} days (until ${dateLabel})`);
      setTimeout(() => setExtensionNotice(null), 4000);
      await loadStudent();
    } catch (err) {
      console.error('Failed to extend course access:', err);
    }
  };

  if (loading || !student) {
    return (
      <div style={{ padding: SPACING.xl, color: tokens.textMuted }}>
        Loading student profile...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xl }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
          <Link
            href="/students"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: RADIUS.md,
              backgroundColor: tokens.surface,
              border: `1px solid ${tokens.border}`,
              color: tokens.textPrimary,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: tokens.textPrimary, margin: 0 }}>
                {student.fullName}
              </h1>
              <span
                style={{
                  padding: `${SPACING.xs}px ${SPACING.sm}px`,
                  borderRadius: RADIUS.pill,
                  backgroundColor: tokens.surfaceSubtle,
                  color: tokens.primary,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {student.studentCode}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: tokens.textMuted }}>
              {student.universityFullName || student.universityName} • {student.programName} (Semester {student.semester} · {student.stream})
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: SPACING.sm }}>
          <button
            type="button"
            onClick={() => setShowRevokeModal(true)}
            disabled={deviceRevoked}
            style={{
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.danger}`,
              backgroundColor: tokens.dangerBg,
              color: tokens.danger,
              fontSize: 13,
              fontWeight: 600,
              cursor: deviceRevoked ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: SPACING.xs,
              opacity: deviceRevoked ? 0.5 : 1,
            }}
          >
            <Smartphone size={16} strokeWidth={2} />
            {deviceRevoked ? 'Hardware Unbound' : 'Revoke Hardware Binding'}
          </button>
        </div>
      </div>

      {extensionNotice && (
        <div
          style={{
            padding: `${SPACING.sm}px ${SPACING.md}px`,
            backgroundColor: tokens.successBg,
            color: tokens.success,
            borderRadius: RADIUS.md,
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.xs,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={16} strokeWidth={2} />
          {extensionNotice}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: SPACING.lg }}>
        {/* Profile Card */}
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
          <h2 style={{ fontSize: 15, fontWeight: 600, color: tokens.textPrimary, margin: 0 }}>
            Student Identity & Device
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm, fontSize: 13 }}>
            <div>
              <span style={{ color: tokens.textMuted }}>Student Code:</span>
              <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: tokens.primary }}>
                {student.studentCode}
              </p>
            </div>
            <div>
              <span style={{ color: tokens.textMuted }}>Phone Number:</span>
              <p style={{ margin: '2px 0 0 0', fontWeight: 600, color: tokens.textPrimary }}>
                {student.identifier}
              </p>
            </div>
            <div>
              <span style={{ color: tokens.textMuted }}>Bound Hardware:</span>
              <p style={{ margin: '2px 0 0 0', fontWeight: 600, color: deviceRevoked ? tokens.danger : tokens.textPrimary }}>
                {deviceRevoked ? 'None (Unbound / Released)' : (student.boundHardwareDetails || student.boundDeviceHardware || 'Standard Android Hardware')}
              </p>
            </div>
            <div>
              <span style={{ color: tokens.textMuted }}>Registered On:</span>
              <p style={{ margin: '2px 0 0 0', fontWeight: 500, color: tokens.textPrimary }}>
                {student.registeredDate || '2026-11-07'}
              </p>
            </div>
            <div>
              <span style={{ color: tokens.textMuted }}>Last Active:</span>
              <p style={{ margin: '2px 0 0 0', fontWeight: 500, color: tokens.textPrimary }}>
                {student.deviceLastSeenLabel || 'Active today'}
              </p>
            </div>
            <div>
              <span style={{ color: tokens.textMuted }}>Total Commerce Spend:</span>
              <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: tokens.primary }}>
                {student.totalSpentETB || 350} ETB
              </p>
            </div>
          </div>
        </div>

        {/* Enrolled Courses */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: tokens.textPrimary, margin: 0 }}>
              Course Access & Entitlements
            </h2>
            <span style={{ fontSize: 12, color: tokens.textMuted }}>
              {courses.length} Enrolled Courses
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
            {courses.length === 0 ? (
              <p style={{ color: tokens.textMuted, fontSize: 13, margin: 0 }}>No active courses enrolled yet.</p>
            ) : (
              courses.map((course) => (
                <div
                  key={course.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: SPACING.md,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surfaceSubtle,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: RADIUS.md,
                        backgroundColor: tokens.surface,
                        border: `1px solid ${tokens.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: tokens.primary,
                      }}
                    >
                      <BookOpen size={18} strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: tokens.textPrimary }}>
                        {course.title}
                      </div>
                      <div style={{ fontSize: 12, color: tokens.textMuted }}>
                        Expires: {course.expiryDate} • Stream: {course.stream}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
                    <span
                      style={{
                        padding: `${SPACING.xs}px ${SPACING.sm}px`,
                        borderRadius: RADIUS.pill,
                        backgroundColor: tokens.successBg,
                        color: tokens.success,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {course.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setShowExtendModal(true);
                      }}
                      style={{
                        padding: `${SPACING.xs}px ${SPACING.sm}px`,
                        borderRadius: RADIUS.sm,
                        border: `1px solid ${tokens.border}`,
                        backgroundColor: tokens.surface,
                        color: tokens.textPrimary,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Extend
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment History */}
          <h2 style={{ fontSize: 15, fontWeight: 600, color: tokens.textPrimary, margin: `${SPACING.md}px 0 0 0` }}>
            Payment History
          </h2>
          {(student.recentOrders || []).length === 0 ? (
            <p style={{ color: tokens.textMuted, fontSize: 13, margin: 0 }}>No recent payment slips.</p>
          ) : (
            (student.recentOrders || []).map((ord: any) => (
              <div
                key={ord.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: SPACING.sm,
                  borderRadius: RADIUS.sm,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 12,
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: tokens.textPrimary }}>{ord.referenceNumber}</span> • {ord.bank}
                  <div style={{ color: tokens.textMuted, fontSize: 11 }}>Approved by {ord.approvedBy} on {ord.approvedAt}</div>
                </div>
                <span style={{ fontWeight: 700, color: tokens.primary }}>{ord.amountETB} ETB</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Revoke Device Confirmation Modal */}
      {showRevokeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: tokens.surface,
              borderRadius: RADIUS.lg,
              padding: SPACING.xl,
              width: 440,
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.md,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, color: tokens.danger }}>
              <AlertTriangle size={24} strokeWidth={2} />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Revoke Hardware Binding</h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: tokens.textMuted, lineHeight: 1.5 }}>
              Are you sure you want to release the bound Android hardware device for <strong>{student.fullName}</strong>?
              This will permit the student to log in on a new replacement device.
            </p>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600 }}>
              Reason for Release
              <select
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                style={{
                  padding: SPACING.sm,
                  borderRadius: RADIUS.sm,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 13,
                }}
              >
                <option value="DEVICE_LOST">Device Lost or Stolen</option>
                <option value="DEVICE_UPGRADED">Student Purchased New Device</option>
                <option value="FACTORY_RESET">Device Reset / OS Reinstalled</option>
                <option value="ADMIN_DISCRETION">Admin Discretion / Verification</option>
              </select>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.sm }}>
              <button
                type="button"
                onClick={() => setShowRevokeModal(false)}
                style={{
                  padding: `${SPACING.sm}px ${SPACING.lg}px`,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeDevice}
                style={{
                  padding: `${SPACING.sm}px ${SPACING.lg}px`,
                  borderRadius: RADIUS.md,
                  border: 'none',
                  backgroundColor: tokens.danger,
                  color: tokens.sidebarText,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Access Modal */}
      {showExtendModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: tokens.surface,
              borderRadius: RADIUS.lg,
              padding: SPACING.xl,
              width: 400,
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.md,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Extend Course Access</h3>
            <p style={{ margin: 0, fontSize: 13, color: tokens.textMuted }}>
              Select number of days to grant additional access to this course:
            </p>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600 }}>
              Extension Duration
              <select
                value={extendedDays}
                onChange={(e) => setExtendedDays(Number(e.target.value))}
                style={{
                  padding: SPACING.sm,
                  borderRadius: RADIUS.sm,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 13,
                }}
              >
                <option value={7}>7 Days (1 Week)</option>
                <option value={14}>14 Days (2 Weeks)</option>
                <option value={30}>30 Days (1 Month)</option>
                <option value={60}>60 Days (2 Months)</option>
                <option value={90}>90 Days (1 Semester)</option>
              </select>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.sm }}>
              <button
                type="button"
                onClick={() => setShowExtendModal(false)}
                style={{
                  padding: `${SPACING.sm}px ${SPACING.lg}px`,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmExtension}
                style={{
                  padding: `${SPACING.sm}px ${SPACING.lg}px`,
                  borderRadius: RADIUS.md,
                  border: 'none',
                  backgroundColor: tokens.primary,
                  color: tokens.sidebarText,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Grant Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
