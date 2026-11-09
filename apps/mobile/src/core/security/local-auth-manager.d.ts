import { StudentAccountState } from '@mastera/contracts';
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
export declare function computeLockoutDurationMs(failedAttempts: number): number;
export declare function hashLocalPassword(plaintext: string, saltHex?: string): {
    saltHex: string;
    hashHex: string;
};
export declare function verifyLocalPasswordConstantTime(plaintext: string, saltHex: string, expectedHashHex: string): boolean;
export declare class LocalAuthManager {
    private account;
    private studentNetworkRequestsSent;
    registerLocalAccountOffline(params: {
        fullName: string;
        identifier: string;
        password: string;
        confirmPassword: string;
        stream?: 'NATURAL' | 'SOCIAL';
    }): StoredLocalCredentials;
    saveProfileSetupOffline(profile: {
        universityId: string;
        programId: string;
        semester: 1 | 2;
        stream: 'NATURAL' | 'SOCIAL';
        selectedCourseIds: string[];
    }): StoredLocalCredentials;
    /**
     * Allows any student (local-only or registered) to check in (add) or check out (remove)
     * any course in their "My Courses" list from either the Course tab or Profile -> My courses.
     * Note from design sheet: "Adding a course to your list does not unlock it."
     */
    toggleCourseInMyCoursesList(courseId: string): string[];
    setMyCoursesList(courseIds: string[]): string[];
    signInOffline(identifier: string, password: string, nowMs?: number): {
        success: boolean;
        lockedRemainingSeconds?: number;
        account?: StoredLocalCredentials;
        reason: string;
    };
    /**
     * DR-06 Two-Mode Forgot Password Behaviour:
     * - LOCAL_ONLY -> Show notice: "Local password cannot be reset. You can re-register (data will be lost)."
     * - REGISTERED_REMOTE -> Normal OTP reset.
     */
    resolveForgotPasswordAction(): ForgotPasswordResolution;
    wipeLocalAccountForReRegistration(): void;
    promoteToRegisteredRemote(studentCode: string): void;
    canSendStudentDataToServer(): boolean;
    getStudentNetworkRequestCount(): number;
    getAccount(): StoredLocalCredentials | null;
    seedLegacyPlaintextAccountForTest(params: {
        identifier: string;
        plaintextPassword: string;
        fullName: string;
    }): void;
    private recordFailedAttempt;
}
//# sourceMappingURL=local-auth-manager.d.ts.map