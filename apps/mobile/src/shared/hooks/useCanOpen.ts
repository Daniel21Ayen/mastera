import { useMemo } from 'react';
import { resolveCanOpen, CanOpenContext } from '@mastera/domain';

export function useCanOpen(ctx: CanOpenContext) {
  return useMemo(() => resolveCanOpen(ctx), [
    ctx.isItemActive,
    ctx.isItemPublished,
    ctx.isItemDeleted,
    ctx.hasActiveEntitlementForCourse,
    ctx.isCourseFreeAccess,
    ctx.isItemFreeAtItemLevel,
  ]);
}
