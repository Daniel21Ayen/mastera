export interface VersionComparisonResult {
  hasUpdate: boolean;
  localVersion: number;
  remoteVersion: number;
}

/**
 * Compares local content or catalog version against remote server version (Section 8.3).
 */
export function compareVersions(
  localVersion: number,
  remoteVersion: number
): VersionComparisonResult {
  return {
    hasUpdate: remoteVersion > localVersion,
    localVersion,
    remoteVersion,
  };
}
