import { BundleProductConfigDto, CatalogCourseDto } from '@mastera/contracts';

export interface BundleValidationResult {
  valid: boolean;
  errorCode?: 'BUNDLE_SIZE_INVALID' | 'DUPLICATE_COURSES' | 'SCOPE_MISMATCH';
  message: string;
}

export function validateBundleSelection(
  selectedCourseIds: string[],
  availableCourses: CatalogCourseDto[],
  config: BundleProductConfigDto
): BundleValidationResult {
  // 1. Deduplicate check
  const uniqueIds = Array.from(new Set(selectedCourseIds));
  if (uniqueIds.length !== selectedCourseIds.length) {
    return {
      valid: false,
      errorCode: 'DUPLICATE_COURSES',
      message: 'Duplicate course IDs are not allowed in a bundle selection.',
    };
  }

  // 2. Min/Max count check (Section 6.3)
  if (uniqueIds.length < config.minCourses || uniqueIds.length > config.maxCourses) {
    return {
      valid: false,
      errorCode: 'BUNDLE_SIZE_INVALID',
      message: `Selected course count (${uniqueIds.length}) must be between ${config.minCourses} and ${config.maxCourses}.`,
    };
  }

  // 3. Verify all selected courses exist and match allowed active state
  for (const id of uniqueIds) {
    const found = availableCourses.find((c) => c.id === id);
    if (!found || !found.isActive) {
      return {
        valid: false,
        errorCode: 'SCOPE_MISMATCH',
        message: `Course ID ${id} is inactive or does not belong to the catalog scope.`,
      };
    }
  }

  return { valid: true, message: 'Bundle selection is valid.' };
}