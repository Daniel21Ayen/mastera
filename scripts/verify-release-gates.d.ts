export declare const MAX_ARM64_AAB_DOWNLOAD_BYTES: number;
export declare const MAX_REFERENCE_PHONE_RAM_MB = 120;
export declare const MIN_WCAG_CONTRAST_RATIO = 4.5;
/**
 * Computes WCAG 2.1 relative luminance and contrast ratio between two hex colors.
 */
export declare function computeWcagContrastRatio(hexA: string, hexB: string): number;
/**
 * Simulates rendering a 30-formula chapter with a single shared math renderer
 * (NFR-18: zero WebView per paragraph) and measures total process RSS/Heap in MB.
 */
export declare function verifySharedMathRendererMemoryBudget(formulaCount?: number): {
    renderedFormulasCount: number;
    heapUsedMB: number;
    withinBudget: boolean;
};
export declare function runAllReleaseGateChecks(simulatedArm64DownloadBytes?: number): void;
//# sourceMappingURL=verify-release-gates.d.ts.map