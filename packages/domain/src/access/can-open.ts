export interface CanOpenContext {
  isItemActive: boolean;
  isItemPublished: boolean;
  isItemDeleted: boolean;
  hasActiveEntitlementForCourse: boolean;
  isCourseFreeAccess: boolean;
  isItemFreeAtItemLevel: boolean; // e.g., chapter Free flag, first N free-trial items, free exam set
}

export function resolveCanOpen(ctx: CanOpenContext): { allowed: boolean; reason: string } {
  // Step 1: Item inactive, unpublished, or deleted -> unavailable
  if (!ctx.isItemActive || !ctx.isItemPublished || ctx.isItemDeleted) {
    return { allowed: false, reason: 'Item is inactive, unpublished, or deleted.' };
  }

  // Step 2: Student has active entitlement for the item's course -> open
  if (ctx.hasActiveEntitlementForCourse) {
    return { allowed: true, reason: 'Active course entitlement grants access.' };
  }

  // Step 3: Course has Free Access -> open
  if (ctx.isCourseFreeAccess) {
    return { allowed: true, reason: 'Course has global Free Access.' };
  }

  // Step 4: Item is free at item level (chapter Free flag, free trial count, sample set) -> open
  if (ctx.isItemFreeAtItemLevel) {
    return { allowed: true, reason: 'Item is flagged as free at item level.' };
  }

  // Step 5: Otherwise locked
  return { allowed: false, reason: 'Content locked. Active entitlement or purchase required.' };
}