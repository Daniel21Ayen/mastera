import {
  CatalogBookGroupDto,
  CatalogChapterMetaDto,
  QuestionItemDto,
} from '@mastera/contracts';
import { ThemeMode } from '@mastera/ui-tokens';
import { ResolvedCatalogRowView } from '../../core/database/local-catalog-store';

export interface CourseTestsTabProps {
  courseTitle: string;
  quizBooks: ResolvedCatalogRowView<CatalogBookGroupDto>[];
  chaptersByBookId: Record<
    string,
    ResolvedCatalogRowView<CatalogChapterMetaDto>[]
  >;
  questionsByChapterId: Record<string, QuestionItemDto[]>;
  onSwitchCourseTopTab: (tab: 'MATERIAL' | 'TESTS' | 'EXAMS') => void;
  onLockedItemTap: () => void;
  onDownloadChapterTap: (chapterId: string) => void;
  onCompleteQuizChapter: (
    chapterId: string,
    answers: Record<string, string>
  ) => void;
  themeMode?: ThemeMode;
}
