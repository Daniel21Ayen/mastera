import { ExtraCourseTierRuleDto, PriceQuoteItemBreakdownDto } from '@mastera/contracts';

export interface ExtraCourseInput {
  courseId: string;
  courseCode: string;
  courseTitle: string;
}

export function calculateExtraCoursePrice(
  extraCourses: ExtraCourseInput[],
  tiers: ExtraCourseTierRuleDto[]
): { perCourseBreakdown: PriceQuoteItemBreakdownDto[]; totalAmountETB: number } {
  let totalAmountETB = 0;
  const perCourseBreakdown: PriceQuoteItemBreakdownDto[] = [];

  extraCourses.forEach((course, index) => {
    const ordinal = index + 1; // 1-based ordinal position within order
    
    // Find matching tier
    const matchingTier = tiers.find((tier) => {
      const gte = ordinal >= tier.fromOrdinal;
      const lte = tier.toOrdinal === null || ordinal <= tier.toOrdinal;
      return gte && lte;
    });

    const unitPrice = matchingTier ? matchingTier.unitPriceETB : (tiers[tiers.length - 1]?.unitPriceETB ?? 50);
    totalAmountETB += unitPrice;

    perCourseBreakdown.push({
      courseId: course.courseId,
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      ordinalPosition: ordinal,
      appliedUnitPriceETB: unitPrice,
      tierLabel: matchingTier ? `Extra #${ordinal} (Tier)` : `Extra #${ordinal}`,
    });
  });

  return { perCourseBreakdown, totalAmountETB };
}