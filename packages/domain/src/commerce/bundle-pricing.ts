import {
  BundleProductConfigDto,
  BundleProductType,
  OrderProductType,
} from '@mastera/contracts';

export interface CoursePriceInput {
  courseId: string;
  priceETB: number;
}

export function calculateBundlePrice(
  productType: BundleProductType | 'BOTH_STREAMS_PACKAGE',
  selectedCourses: CoursePriceInput[],
  config: BundleProductConfigDto | { pricingMode: 'FIXED'; fixedPriceETB: number; discountPercent?: number },
  bothStreamsPriceOverride?: number
): { baseAmountETB: number; discountAmountETB: number; totalAmountETB: number } {
  if (productType === 'BOTH_STREAMS_PACKAGE') {
    const total = bothStreamsPriceOverride ?? 700;
    return { baseAmountETB: total, discountAmountETB: 0, totalAmountETB: total };
  }

  const baseAmountETB = selectedCourses.reduce(
    (sum, course) => sum + course.priceETB,
    0
  );

  if (config.pricingMode === 'FIXED') {
    const fixed = 'fixedPriceETB' in config ? config.fixedPriceETB : baseAmountETB;
    return {
      baseAmountETB,
      discountAmountETB: Math.max(0, baseAmountETB - fixed),
      totalAmountETB: fixed,
    };
  }

  // Calculated mode
  const discountPercent = 'discountPercent' in config ? config.discountPercent : 0;
  const rawDiscount = (baseAmountETB * discountPercent) / 100;
  // Round to nearest minor unit / whole integer ETB
  const discountAmountETB = Math.round(rawDiscount);
  const totalAmountETB = Math.max(0, baseAmountETB - discountAmountETB);

  return {
    baseAmountETB,
    discountAmountETB,
    totalAmountETB,
  };
}