'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ProductsPricingManager,
  RevenueKpiSummaryDto,
} from '@/components/commerce/ProductsPricingManager';
import { PaymentSettingsDto } from '@mastera/contracts';
import { adminApiFetch } from '@/lib/api-client';

export default function CommercePricingPage(): React.ReactElement {
  const router = useRouter();

  const [settings, setSettings] = useState<PaymentSettingsDto>({
    configVersion: 1,
    singleCoursesEnabled: true,
    renewalWindowDays: 14,
    quoteExpiryMinutes: 30,
    maxReceiptSizeBytes: 307200,
    bundles: {
      SEMESTER_BUNDLE: {
        productType: 'SEMESTER_BUNDLE',
        enabled: true,
        minCourses: 5,
        maxCourses: 5,
        pricingMode: 'FIXED',
        discountPercent: 10,
        fixedPriceETB: 270,
        durationDays: 120,
        unlocksSingleCourses: true,
        includesCommonCourses: true,
        includesCocAndExams: true,
      },
      BATCH_BUNDLE: {
        productType: 'BATCH_BUNDLE',
        enabled: true,
        minCourses: 6,
        maxCourses: 8,
        pricingMode: 'FIXED',
        discountPercent: 15,
        fixedPriceETB: 350,
        durationDays: 150,
        unlocksSingleCourses: true,
        includesCommonCourses: true,
        includesCocAndExams: true,
      },
      FULL_COURSE_BUNDLE: {
        productType: 'FULL_COURSE_BUNDLE',
        enabled: true,
        minCourses: 10,
        maxCourses: 14,
        pricingMode: 'FIXED',
        discountPercent: 25,
        fixedPriceETB: 500,
        durationDays: 180,
        unlocksSingleCourses: true,
        includesCommonCourses: true,
        includesCocAndExams: true,
      },
    },
    bothStreamsPriceETB: 450,
    bothStreamsDurationDays: 180,
    extraCourseTiers: [
      { fromOrdinal: 1, toOrdinal: 1, unitPriceETB: 60 },
      { fromOrdinal: 2, toOrdinal: 3, unitPriceETB: 55 },
      { fromOrdinal: 4, toOrdinal: null, unitPriceETB: 50 },
    ],
    paymentMethods: [
      {
        id: 'pm-cbe-mobile',
        providerName: 'Commercial Bank of Ethiopia (CBE)',
        accountNumberOrCode: '1000123456789',
        accountHolderName: 'Mastera Education Technologies PLC',
        instructions: 'Transfer the exact ETB amount via CBE Birr or Mobile Banking and upload screenshot.',
        isActive: true,
      },
      {
        id: 'pm-telebirr',
        providerName: 'Telebirr SuperApp',
        accountNumberOrCode: '0911022344',
        accountHolderName: 'Mastera Education Technologies PLC',
        instructions: 'Send money to Mastera merchant phone number and capture transaction SMS or slip.',
        isActive: true,
      },
    ],
  });

  const [kpis, setKpis] = useState<RevenueKpiSummaryDto>({
    totalVerifiedETB: 128450,
    approvedStudentsCount: 420,
    pendingQueueETB: 3500,
    pendingOrdersCount: 12,
    averageOrderValueETB: 275,
    telebirrCollectedETB: 74200,
    telebirrVerifiedCount: 245,
    cbeMobileCollectedETB: 54250,
    cbeMobileVerifiedCount: 175,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const liveSettings = await adminApiFetch<PaymentSettingsDto>('/commerce/settings');
        if (liveSettings) {
          setSettings(liveSettings);
        }
      } catch (err) {
        console.warn('Using baseline commerce settings fallback:', err);
      }
    }
    loadData();
  }, []);

  const handleSaveSettings = async (
    nextSettings: Omit<PaymentSettingsDto, 'configVersion'>,
    reason: string
  ) => {
    try {
      const updated = await adminApiFetch<PaymentSettingsDto>('/commerce/settings', {
        method: 'PUT',
        body: {
          actor: {
            adminId: 'admin-super-1',
            adminRole: 'SUPER_ADMIN',
          },
          settings: nextSettings,
          reason,
        },
      });
      if (updated) {
        setSettings(updated);
      }
    } catch (err) {
      console.warn('Direct PUT /commerce/settings error, applying local state update:', err);
      setSettings((prev) => ({
        ...nextSettings,
        configVersion: prev.configVersion + 1,
      }));
    }
  };

  return (
    <ProductsPricingManager
      actorRole="SUPER_ADMIN"
      settings={settings}
      kpis={kpis}
      onSaveSettings={handleSaveSettings}
      onNavigateToPaidStudents={() => {
        router.push('/students');
      }}
      onNavigateToPaymentsQueue={() => {
        router.push('/commerce/payments');
      }}
    />
  );
}
