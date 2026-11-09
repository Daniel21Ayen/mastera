export interface SinglePurchaseCheckParams {
  singleCoursesEnabled: boolean;
  hasActiveQualifyingBundle: boolean;
  isCourseAlreadyOwnedOrIncluded: boolean;
}

export function canPurchaseSingleCourse(params: SinglePurchaseCheckParams): {
  allowed: boolean;
  errorCode?: 'SINGLE_COURSES_DISABLED' | 'SINGLE_COURSE_BUNDLE_REQUIRED' | 'COURSE_ALREADY_INCLUDED';
  message: string;
} {
  if (!params.singleCoursesEnabled) {
    return {
      allowed: false,
      errorCode: 'SINGLE_COURSES_DISABLED',
      message: 'Single-course purchases are currently disabled by administration.',
    };
  }

  if (!params.hasActiveQualifyingBundle) {
    return {
      allowed: false,
      errorCode: 'SINGLE_COURSE_BUNDLE_REQUIRED',
      message: 'Buy a semester or full bundle first to unlock single courses.',
    };
  }

  if (params.isCourseAlreadyOwnedOrIncluded) {
    return {
      allowed: false,
      errorCode: 'COURSE_ALREADY_INCLUDED',
      message: 'This course is already covered by your active bundle or entitlement.',
    };
  }

  return { allowed: true, message: 'Eligible for single course purchase.' };
}