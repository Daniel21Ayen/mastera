import { useMemo } from 'react';
import { EntitlementRecordDto } from '@mastera/contracts';

export function useEntitlementStatus(
  entitlements: EntitlementRecordDto[],
  courseId: string
) {
  return useMemo(() => {
    const ent = entitlements.find(
      (e) => e.courseId === courseId && e.status === 'ACTIVE'
    );
    if (!ent) {
      return { isEntitled: false, daysRemaining: null };
    }

    const expiresAt = new Date(ent.expiresAt).getTime();
    const now = Date.now();
    const daysRemaining = Math.max(
      0,
      Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
    );

    return {
      isEntitled: daysRemaining > 0,
      daysRemaining,
    };
  }, [entitlements, courseId]);
}
