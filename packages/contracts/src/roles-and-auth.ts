export type AccountType = 'STUDENT' | 'ADMIN';

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'ACADEMIC_ADMIN'
  | 'OPERATIONS_ADMIN';

export type StudentAccountState =
  | 'LOCAL_ONLY'
  | 'PAYMENT_PENDING'
  | 'REGISTERED_REMOTE';

export type AdminScopeLevel = 'UNIVERSITY' | 'PROGRAM' | 'COURSE';

export interface AdminScopeAssignmentDto {
  id: string;
  adminId: string;
  universityId?: string | null;
  programId?: string | null;
  courseId?: string | null;
}

export interface AdminUserDto {
  id: string;
  name: string;
  email: string;
  adminRole: AdminRole;
  totpEnabled: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  scopes: AdminScopeAssignmentDto[];
}

export interface StudentProfileInputDto {
  fullName: string;
  identifier: string; // Phone or email (Q20)
  universityId: string;
  programId: string;
  semester: 1 | 2;
  stream: 'NATURAL' | 'SOCIAL';
  selectedCourseIds: string[];
}