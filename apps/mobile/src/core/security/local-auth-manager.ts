import { StudentAccountState } from '@mastera/contracts';
import {
  bytesToHex,
  randomBytes,
  randomUUID,
  pbkdf2Sha256Hex,
  timingSafeEqual,
} from '@mastera/domain';

export interface StoredLocalCredentials {
  localAccountId: string;
  studentCode: string | null;
  accountState: StudentAccountState;
  fullName: string;
  identifier: string;
  passwordSaltHex: string | null;
  passwordHashHex: string | null;
  legacyPlaintextPassword?: string | null | undefined;
  failedAttempts: number;
  lockedUntilMs: number | null;
  profileComplete: boolean;
  universityId: string | null;
  programId: string | null;
  semester: 1 | 2 | null;
  stream: 'NATURAL' | 'SOCIAL' | null;
  selectedCourseIds: string[];
}

export interface ForgotPasswordResolution {
  mode: 'LOCAL_RESET_WARNING' | 'SERVER_OTP_RESET';
  title: string;
  message: string;
  canResetViaOtp: boolean;
  allowsLocalWipeAndReRegister: boolean;
}

const PBKDF2_ITERATIONS = 1000;
const KEY_LENGTH_BYTES = 32;
const LOCKOUT_THRESHOLD = 5;
const INITIAL_LOCKOUT_SECONDS = 30;
const MAX_LOCKOUT_SECONDS = 15 * 60;

export function computeLockoutDurationMs(failedAttempts: number): number {
  if (failedAttempts < LOCKOUT_THRESHOLD) {
    return 0;
  }
  const exponent = failedAttempts - LOCKOUT_THRESHOLD;
  const seconds = Math.min(
    MAX_LOCKOUT_SECONDS,
    INITIAL_LOCKOUT_SECONDS * Math.pow(2, exponent)
  );
  return seconds * 1000;
}

export function hashLocalPassword(
  plaintext: string,
  saltHex: string = bytesToHex(randomBytes(16))
): { saltHex: string; hashHex: string } {
  const hashHex = pbkdf2Sha256Hex(
    plaintext,
    saltHex,
    PBKDF2_ITERATIONS,
    KEY_LENGTH_BYTES
  );
  return { saltHex, hashHex };
}

export function verifyLocalPasswordConstantTime(
  plaintext: string,
  saltHex: string,
  expectedHashHex: string
): boolean {
  const { hashHex } = hashLocalPassword(plaintext, saltHex);
  return timingSafeEqual(hashHex, expectedHashHex);
}

export class LocalAuthManager {
  private account: StoredLocalCredentials | null = null;
  private studentNetworkRequestsSent = 0;

  registerLocalAccountOffline(params: {
    fullName: string;
    identifier: string;
    password: string;
    confirmPassword: string;
    stream?: 'NATURAL' | 'SOCIAL';
  }): StoredLocalCredentials {
    const cleanName = params.fullName.trim();
    const cleanId = params.identifier.trim().toLowerCase();

    if (!cleanName || !cleanId) {
      throw new Error('Full name and email or phone number are required.');
    }
    if (params.password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    if (params.password !== params.confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    const { saltHex, hashHex } = hashLocalPassword(params.password);
    this.account = {
      localAccountId: randomUUID(),
      studentCode: null,
      accountState: 'LOCAL_ONLY',
      fullName: cleanName,
      identifier: cleanId,
      passwordSaltHex: saltHex,
      passwordHashHex: hashHex,
      legacyPlaintextPassword: null,
      failedAttempts: 0,
      lockedUntilMs: null,
      profileComplete: false,
      universityId: null,
      programId: null,
      semester: null,
      stream: params.stream ?? 'NATURAL',
      selectedCourseIds: [],
    };

    return { ...this.account };
  }

  saveProfileSetupOffline(profile: {
    universityId: string;
    programId: string;
    semester: 1 | 2;
    stream: 'NATURAL' | 'SOCIAL';
    selectedCourseIds: string[];
  }): StoredLocalCredentials {
    if (!this.account) {
      throw new Error('No local account exists on this device.');
    }

    this.account = {
      ...this.account,
      universityId: profile.universityId,
      programId: profile.programId,
      semester: profile.semester,
      stream: profile.stream,
      selectedCourseIds: Array.from(new Set(profile.selectedCourseIds)),
      profileComplete: true,
    };

    return { ...this.account };
  }

  /**
   * Allows any student (local-only or registered) to check in (add) or check out (remove)
   * any course in their "My Courses" list from either the Course tab or Profile -> My courses.
   * Note from design sheet: "Adding a course to your list does not unlock it."
   */
  toggleCourseInMyCoursesList(courseId: string): string[] {
    if (!this.account) {
      throw new Error('No active student account.');
    }
    const currentSet = new Set(this.account.selectedCourseIds);
    if (currentSet.has(courseId)) {
      currentSet.delete(courseId);
    } else {
      currentSet.add(courseId);
    }
    this.account.selectedCourseIds = Array.from(currentSet);
    return [...this.account.selectedCourseIds];
  }

  setMyCoursesList(courseIds: string[]): string[] {
    if (!this.account) {
      throw new Error('No active student account.');
    }
    this.account.selectedCourseIds = Array.from(new Set(courseIds));
    return [...this.account.selectedCourseIds];
  }

  signInOffline(
    identifier: string,
    password: string,
    nowMs: number = Date.now()
  ): {
    success: boolean;
    lockedRemainingSeconds?: number;
    account?: StoredLocalCredentials;
    reason: string;
  } {
    if (!this.account) {
      return {
        success: false,
        reason:
          'No account found on this phone. Create a local account or connect to the internet if you paid on another phone.',
      };
    }

    if (
      this.account.lockedUntilMs !== null &&
      nowMs < this.account.lockedUntilMs
    ) {
      const remainingSec = Math.ceil(
        (this.account.lockedUntilMs - nowMs) / 1000
      );
      return {
        success: false,
        lockedRemainingSeconds: remainingSec,
        reason: `Too many failed attempts. Try again in ${remainingSec}s.`,
      };
    }

    const cleanId = identifier.trim().toLowerCase();
    if (!password || cleanId !== this.account.identifier) {
      return this.recordFailedAttempt(nowMs);
    }

    if (
      this.account.legacyPlaintextPassword &&
      !this.account.passwordHashHex
    ) {
      if (password === this.account.legacyPlaintextPassword) {
        const upgraded = hashLocalPassword(password);
        this.account.passwordSaltHex = upgraded.saltHex;
        this.account.passwordHashHex = upgraded.hashHex;
        delete this.account.legacyPlaintextPassword;
        this.account.failedAttempts = 0;
        this.account.lockedUntilMs = null;
        return {
          success: true,
          account: { ...this.account },
          reason:
            'Signed in offline (legacy password upgraded to salted hash).',
        };
      }
      return this.recordFailedAttempt(nowMs);
    }

    if (!this.account.passwordSaltHex || !this.account.passwordHashHex) {
      return this.recordFailedAttempt(nowMs);
    }

    const matches = verifyLocalPasswordConstantTime(
      password,
      this.account.passwordSaltHex,
      this.account.passwordHashHex
    );

    if (!matches) {
      return this.recordFailedAttempt(nowMs);
    }

    this.account.failedAttempts = 0;
    this.account.lockedUntilMs = null;
    return {
      success: true,
      account: { ...this.account },
      reason: 'Signed in offline.',
    };
  }

  /**
   * DR-06 Two-Mode Forgot Password Behaviour:
   * - LOCAL_ONLY -> Show notice: "Local password cannot be reset. You can re-register (data will be lost)."
   * - REGISTERED_REMOTE -> Normal OTP reset.
   */
  resolveForgotPasswordAction(): ForgotPasswordResolution {
    if (
      !this.account ||
      this.account.accountState === 'LOCAL_ONLY' ||
      this.account.accountState === 'PAYMENT_PENDING'
    ) {
      return {
        mode: 'LOCAL_RESET_WARNING',
        title: 'Forgot password?',
        message:
          'Local password cannot be reset. You can re-register (data will be lost).',
        canResetViaOtp: false,
        allowsLocalWipeAndReRegister: true,
      };
    }

    return {
      mode: 'SERVER_OTP_RESET',
      title: 'Reset password via OTP',
      message:
        'Enter the 6-digit OTP code sent to your registered phone or email to reset your password.',
      canResetViaOtp: true,
      allowsLocalWipeAndReRegister: false,
    };
  }

  wipeLocalAccountForReRegistration(): void {
    if (this.account?.accountState === 'REGISTERED_REMOTE') {
      throw new Error(
        'Registered remote accounts must use OTP password reset, not local wipe.'
      );
    }
    this.account = null;
  }

  promoteToRegisteredRemote(studentCode: string): void {
    if (!this.account) return;
    this.account = {
      ...this.account,
      studentCode,
      accountState: 'REGISTERED_REMOTE',
    };
  }

  canSendStudentDataToServer(): boolean {
    return this.account?.accountState === 'REGISTERED_REMOTE';
  }

  getStudentNetworkRequestCount(): number {
    return this.studentNetworkRequestsSent;
  }

  getAccount(): StoredLocalCredentials | null {
    return this.account ? { ...this.account } : null;
  }

  seedLegacyPlaintextAccountForTest(params: {
    identifier: string;
    plaintextPassword: string;
    fullName: string;
  }): void {
    this.account = {
      localAccountId: randomUUID(),
      studentCode: null,
      accountState: 'LOCAL_ONLY',
      fullName: params.fullName,
      identifier: params.identifier.toLowerCase(),
      passwordSaltHex: null,
      passwordHashHex: null,
      legacyPlaintextPassword: params.plaintextPassword,
      failedAttempts: 0,
      lockedUntilMs: null,
      profileComplete: true,
      universityId: 'uni-bdu',
      programId: 'prog-fresh',
      semester: 1,
      stream: 'NATURAL',
      selectedCourseIds: [],
    };
  }

  private recordFailedAttempt(nowMs: number): {
    success: false;
    lockedRemainingSeconds?: number;
    reason: string;
  } {
    if (!this.account) {
      return { success: false, reason: 'Invalid credentials.' };
    }
    this.account.failedAttempts += 1;
    const lockMs = computeLockoutDurationMs(this.account.failedAttempts);
    if (lockMs > 0) {
      this.account.lockedUntilMs = nowMs + lockMs;
      const secs = Math.ceil(lockMs / 1000);
      return {
        success: false,
        lockedRemainingSeconds: secs,
        reason: `Account locked for ${secs}s after ${this.account.failedAttempts} failed sign-in attempts.`,
      };
    }
    return {
      success: false,
      reason: 'Invalid phone/email or password.',
    };
  }
}