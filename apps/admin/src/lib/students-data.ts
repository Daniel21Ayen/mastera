import { AcademicStream, CatalogCourseDto } from '@mastera/contracts';
import { PaidStudentSummaryDto } from '@/components/students/PaidStudentsDirectory';

export interface StudentDetailRecord extends PaidStudentSummaryDto {
  universityFullName: string;
  registeredDate: string;
  totalSpentETB: number;
  boundHardwareDetails: string;
  recentOrders: Array<{
    id: string;
    referenceNumber: string;
    bank: string;
    amountETB: number;
    approvedAt: string;
    approvedBy: string;
  }>;
}
