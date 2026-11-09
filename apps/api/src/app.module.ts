import { Module } from '@nestjs/common';
import { PrismaService } from './infrastructure/database/prisma.service';
import { S3StorageService } from './infrastructure/storage/s3.service';
import { RedisCacheService } from './infrastructure/cache/redis.service';
import { ExpoPushDispatcherService } from './infrastructure/push/expo-push.service';
import { CounterService } from './modules/counter/counter.service';
import { AuditService } from './modules/audit-reports/audit.service';
import { ScopeAuthorizationService } from './modules/permissions/scope.service';
import { AdminIamService } from './modules/admin-iam/admin-iam.service';
import { AcademicCatalogService } from './modules/academic-catalog/academic-catalog.service';
import { CatalogSnapshotService } from './modules/catalog-snapshot/catalog-snapshot.service';
import { ContentAuthoringService } from './modules/content/content.service';
import { ContentPackageBuilderService } from './modules/content/content-package-builder.service';
import { AssessmentsService } from './modules/assessments/assessments.service';
import { CsvQuestionImportService } from './modules/csv-import/csv-import.service';
import { ScanToPdfService } from './modules/scan-to-pdf/scan-to-pdf.service';
import { CommercePricingService } from './modules/commerce-pricing/commerce-pricing.service';
import { OrdersPaymentsService } from './modules/orders-payments/orders-payments.service';
import { RefundsService } from './modules/refunds/refunds.service';
import { StudentAuthService } from './modules/student-auth/student-auth.service';
import { EntitlementsService } from './modules/entitlements/entitlements.service';
import { StudentsDirectoryService } from './modules/students-directory/students-directory.service';
import { SupportCommsService } from './modules/support-comms/support-comms.service';
import { StudentSyncService } from './modules/sync/sync.service';

import {
  PrismaAuditRepository,
  PrismaAdminRepository,
  PrismaCatalogRepository,
  PrismaSnapshotDataSource,
  PrismaContentRepository,
  PrismaAssessmentRepository,
  PrismaCommercePricingRepository,
  PrismaOrdersRepository,
  PrismaRefundRepository,
  PrismaStudentAuthRepository,
  PrismaStudentsDirectoryRepository,
  PrismaSupportCommsRepository,
  PrismaSyncRepository,
} from './infrastructure/database/prisma-repositories';

import { AdminIamController } from './modules/admin-iam/admin-iam.controller';
import { StudentAuthController } from './modules/student-auth/student-auth.controller';
import { CatalogSnapshotController } from './modules/catalog-snapshot/catalog-snapshot.controller';
import { AcademicCatalogController } from './modules/academic-catalog/academic-catalog.controller';
import { ContentAuthoringController } from './modules/content/content.controller';
import { AssessmentsController } from './modules/assessments/assessments.controller';
import { CsvImportController } from './modules/csv-import/csv-import.controller';
import { CommercePricingController } from './modules/commerce-pricing/commerce-pricing.controller';
import { OrdersPaymentsController } from './modules/orders-payments/orders-payments.controller';
import { RefundsController } from './modules/refunds/refunds.controller';
import { StudentsDirectoryController } from './modules/students-directory/students-directory.controller';
import { SupportCommsController } from './modules/support-comms/support-comms.controller';
import { StudentSyncController } from './modules/sync/sync.controller';
import { AuditReportsController } from './modules/audit-reports/audit-reports.controller';
import { AppController } from './app.controller';

@Module({
  imports: [],
  controllers: [
    AppController,
    AdminIamController,
    StudentAuthController,
    CatalogSnapshotController,
    AcademicCatalogController,
    ContentAuthoringController,
    AssessmentsController,
    CsvImportController,
    CommercePricingController,
    OrdersPaymentsController,
    RefundsController,
    StudentsDirectoryController,
    SupportCommsController,
    StudentSyncController,
    AuditReportsController,
  ],
  providers: [
    PrismaService,
    S3StorageService,
    RedisCacheService,
    ExpoPushDispatcherService,
    CounterService,
    {
      provide: AuditService,
      useFactory: (prisma: PrismaService) =>
        new AuditService(new PrismaAuditRepository(prisma)),
      inject: [PrismaService],
    },
    ScopeAuthorizationService,
    {
      provide: AdminIamService,
      useFactory: (prisma: PrismaService, audit: AuditService) =>
        new AdminIamService(new PrismaAdminRepository(prisma), audit),
      inject: [PrismaService, AuditService],
    },
    {
      provide: AcademicCatalogService,
      useFactory: (
        prisma: PrismaService,
        scope: ScopeAuthorizationService,
        audit: AuditService
      ) =>
        new AcademicCatalogService(
          new PrismaCatalogRepository(prisma),
          scope,
          audit
        ),
      inject: [PrismaService, ScopeAuthorizationService, AuditService],
    },
    {
      provide: CatalogSnapshotService,
      useFactory: (prisma: PrismaService) =>
        new CatalogSnapshotService(new PrismaSnapshotDataSource(prisma)),
      inject: [PrismaService],
    },
    {
      provide: ContentAuthoringService,
      useFactory: (
        prisma: PrismaService,
        scope: ScopeAuthorizationService,
        audit: AuditService
      ) =>
        new ContentAuthoringService(
          new PrismaContentRepository(prisma),
          scope,
          audit
        ),
      inject: [PrismaService, ScopeAuthorizationService, AuditService],
    },
    {
      provide: ContentPackageBuilderService,
      useFactory: (
        prisma: PrismaService,
        s3: S3StorageService,
        audit: AuditService
      ) => new ContentPackageBuilderService(prisma, s3, audit),
      inject: [PrismaService, S3StorageService, AuditService],
    },
    {
      provide: AssessmentsService,
      useFactory: (
        prisma: PrismaService,
        counter: CounterService,
        scope: ScopeAuthorizationService,
        audit: AuditService
      ) =>
        new AssessmentsService(
          new PrismaAssessmentRepository(prisma),
          counter,
          scope,
          audit
        ),
      inject: [
        PrismaService,
        CounterService,
        ScopeAuthorizationService,
        AuditService,
      ],
    },
    CsvQuestionImportService,
    ScanToPdfService,
    {
      provide: CommercePricingService,
      useFactory: (
        prisma: PrismaService,
        scope: ScopeAuthorizationService,
        audit: AuditService
      ) =>
        new CommercePricingService(
          new PrismaCommercePricingRepository(prisma),
          scope,
          audit
        ),
      inject: [PrismaService, ScopeAuthorizationService, AuditService],
    },
    {
      provide: OrdersPaymentsService,
      useFactory: (
        prisma: PrismaService,
        counter: CounterService,
        scope: ScopeAuthorizationService,
        audit: AuditService
      ) =>
        new OrdersPaymentsService(
          new PrismaOrdersRepository(prisma),
          counter,
          scope,
          audit,
          process.env.JWT_SECRET ||
            'mastera_secure_entitlement_signing_key_32_characters_minimum'
        ),
      inject: [
        PrismaService,
        CounterService,
        ScopeAuthorizationService,
        AuditService,
      ],
    },
    {
      provide: RefundsService,
      useFactory: (
        prisma: PrismaService,
        scope: ScopeAuthorizationService,
        audit: AuditService
      ) =>
        new RefundsService(new PrismaRefundRepository(prisma), scope, audit),
      inject: [PrismaService, ScopeAuthorizationService, AuditService],
    },
    {
      provide: StudentAuthService,
      useFactory: (prisma: PrismaService) =>
        new StudentAuthService(new PrismaStudentAuthRepository(prisma)),
      inject: [PrismaService],
    },
    EntitlementsService,
    {
      provide: StudentsDirectoryService,
      useFactory: (prisma: PrismaService, audit: AuditService) =>
        new StudentsDirectoryService(
          new PrismaStudentsDirectoryRepository(prisma),
          audit
        ),
      inject: [PrismaService, AuditService],
    },
    {
      provide: SupportCommsService,
      useFactory: (prisma: PrismaService, audit: AuditService) =>
        new SupportCommsService(new PrismaSupportCommsRepository(prisma), audit),
      inject: [PrismaService, AuditService],
    },
    {
      provide: StudentSyncService,
      useFactory: (prisma: PrismaService) =>
        new StudentSyncService(new PrismaSyncRepository(prisma)),
      inject: [PrismaService],
    },
  ],
  exports: [
    PrismaService,
    S3StorageService,
    RedisCacheService,
    ExpoPushDispatcherService,
    CounterService,
    AuditService,
    ScopeAuthorizationService,
    AdminIamService,
    AcademicCatalogService,
    CatalogSnapshotService,
    ContentAuthoringService,
    ContentPackageBuilderService,
    AssessmentsService,
    CsvQuestionImportService,
    ScanToPdfService,
    CommercePricingService,
    OrdersPaymentsService,
    RefundsService,
    StudentAuthService,
    EntitlementsService,
    StudentsDirectoryService,
    SupportCommsService,
    StudentSyncService,
  ],
})
export class AppModule {}
