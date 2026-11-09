'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScanToPdfWizard } from '@/components/content/ScanToPdfWizard';
import {
  CatalogCourseDto,
  CatalogProgramDto,
  CatalogUniversityDto,
} from '@mastera/contracts';
import { adminApiFetch } from '@/lib/api-client';
import { ADMIN_THEMES } from '@mastera/ui-tokens';

export default function ScanToPdfPage(): React.ReactElement {
  const router = useRouter();
  const [courses, setCourses] = useState<CatalogCourseDto[]>([]);
  const [universities, setUniversities] = useState<CatalogUniversityDto[]>([]);
  const [programs, setPrograms] = useState<CatalogProgramDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadCatalog() {
      try {
        const [courseRes, univRes, progRes] = await Promise.all([
          adminApiFetch<{ items: CatalogCourseDto[] }>('/catalog/courses'),
          adminApiFetch<{ items: CatalogUniversityDto[] }>('/catalog/universities'),
          adminApiFetch<{ items: CatalogProgramDto[] }>('/catalog/programs'),
        ]);

        if (isCancelled) return;
        setCourses(courseRes?.items || []);
        setUniversities(univRes?.items || []);
        setPrograms(progRes?.items || []);
      } catch (err) {
        console.error('Failed to load catalog for Scan to PDF:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadCatalog();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div style={{ padding: 32, color: ADMIN_THEMES.light.textMuted }}>
        Loading catalog data...
      </div>
    );
  }

  return (
    <ScanToPdfWizard
      courses={courses}
      universities={universities}
      programs={programs}
      onPublishPdf={(summary) => {
        const cat = summary.category;
        if (cat === 'Modules') {
          router.push(`/content/materials/modules/new?courseId=${summary.courseId}`);
        } else if (cat === 'Notes') {
          router.push(`/content/materials/notes/new?courseId=${summary.courseId}`);
        } else if (cat === 'Amharic Notes') {
          router.push(`/content/materials/amharic-notes/new?courseId=${summary.courseId}`);
        } else if (cat === 'Quiz 1') {
          router.push(`/content/tests/quiz-1/new?courseId=${summary.courseId}`);
        } else if (cat === 'Quiz 2') {
          router.push(`/content/tests/quiz-2/new?courseId=${summary.courseId}`);
        } else if (cat === 'Quiz 3') {
          router.push(`/content/tests/quiz-3/new?courseId=${summary.courseId}`);
        } else if (cat === 'Mid Exam') {
          router.push('/questions/mid-exams');
        } else if (cat === 'Final Exam') {
          router.push('/questions/final-exams');
        } else if (cat === 'Mock Exam') {
          router.push('/questions/mock-exams');
        } else if (cat === 'COC Exam') {
          router.push('/questions/coc-exams');
        } else {
          router.push('/content/materials/modules');
        }
      }}
    />
  );
}
