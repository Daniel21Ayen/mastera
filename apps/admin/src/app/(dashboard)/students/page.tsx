'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PaidStudentsDirectory, PaidStudentSummaryDto } from '@/components/students/PaidStudentsDirectory';
import { CatalogCourseDto } from '@mastera/contracts';
import { adminApiFetch } from '@/lib/api-client';

export default function StudentsDirectoryPage(): React.ReactElement {
  const router = useRouter();
  const [students, setStudents] = useState<PaidStudentSummaryDto[]>([]);
  const [availableCourses, setAvailableCourses] = useState<CatalogCourseDto[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const pageSize = 10;

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [studentsRes, coursesRes] = await Promise.all([
        adminApiFetch<{ items: PaidStudentSummaryDto[]; total: number }>('/students'),
        adminApiFetch<{ items: CatalogCourseDto[] }>('/catalog/courses'),
      ]);
      setStudents(studentsRes?.items || []);
      setAvailableCourses(coursesRes?.items || []);
    } catch (err) {
      console.error('Failed to load students directory:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRevokeDevice = async (studentId: string, reason: string) => {
    try {
      await adminApiFetch(`/students/${studentId}/device-release`, {
        method: 'POST',
        body: { reason },
      });
      await loadData();
    } catch (err) {
      console.error('Failed to revoke device:', err);
      // Optimistic update fallback
      setStudents((prev) =>
        prev.map((s) =>
          s.studentId === studentId
            ? {
                ...s,
                deviceBound: false,
                deviceBoundDateLabel: 'Revoked',
                deviceLastSeenLabel: `Revoked: ${reason}`,
              }
            : s
        )
      );
    }
  };

  const handleGrantOrExtendAccess = async (
    studentId: string,
    courseId: string,
    days: number,
    reason: string
  ) => {
    try {
      await adminApiFetch(`/students/${studentId}/grant-access`, {
        method: 'POST',
        body: { courseId, durationDays: days, reason },
      });
      await loadData();
    } catch (err) {
      console.error('Failed to grant/extend access:', err);
      // Optimistic update fallback
      setStudents((prev) =>
        prev.map((s) => {
          if (s.studentId !== studentId) return s;
          const targetCourse = availableCourses.find((c) => c.id === courseId);
          const courseTitle = targetCourse ? targetCourse.title : 'Course';
          const stream = targetCourse ? targetCourse.stream : 'COMMON';
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + days);
          const expiresLabel = expiryDate.toISOString().split('T')[0] ?? '';

          const existing = s.enrolledCourses.find((c) => c.courseId === courseId);
          const updatedEnrolled = existing
            ? s.enrolledCourses.map((c) =>
                c.courseId === courseId
                  ? { ...c, expiresDateLabel: expiresLabel, accessStatus: 'Paid' as const }
                  : c
              )
            : [
                ...s.enrolledCourses,
                {
                  courseId,
                  courseTitle,
                  stream,
                  accessStatus: 'Paid' as const,
                  expiresDateLabel: expiresLabel,
                },
              ];

          return {
            ...s,
            coursesCount: updatedEnrolled.length,
            enrolledCourses: updatedEnrolled,
          };
        })
      );
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Student Code',
      'Full Name',
      'University',
      'Program',
      'Semester',
      'Stream',
      'Phone/Email',
      'Enrolled Courses Count',
      'Device Status',
    ];

    const rows = students.map((s) => [
      s.studentCode,
      `"${s.fullName}"`,
      s.universityShortName,
      `"${s.programName}"`,
      s.semester,
      s.stream,
      s.identifier,
      s.coursesCount,
      s.deviceBound ? 'Bound' : 'Released',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mastera_paid_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PaidStudentsDirectory
      studentsPage={{
        page: currentPage,
        pageSize,
        total: students.length,
        totalPages: Math.ceil(students.length / pageSize) || 1,
        items: students,
      }}
      availableCourses={availableCourses}
      onPageChange={(page) => setCurrentPage(page)}
      onExportCsv={handleExportCsv}
      onRevokeDevice={handleRevokeDevice}
      onGrantOrExtendAccess={handleGrantOrExtendAccess}
      onViewStudent={(studentId) => router.push(`/students/${studentId}`)}
    />
  );
}
