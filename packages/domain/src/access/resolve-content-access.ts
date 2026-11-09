import { resolveCanOpen, CanOpenContext } from './can-open';

export type ContentAccessResolutionMode =
  | 'ONLINE_STREAM'
  | 'OFFLINE_LOCAL'
  | 'NOT_AVAILABLE_OFFLINE'
  | 'PAYWALL_LOCKED'
  | 'UPDATE_AVAILABLE';

export interface ResolveContentAccessInput {
  canOpenContext: CanOpenContext;
  isOnline: boolean;
  hasDownloadedFile: boolean;
  isDownloadedVersionCurrent: boolean;
}

export interface ResolveContentAccessResult {
  canOpen: boolean;
  resolutionMode: ContentAccessResolutionMode;
  reason: string;
}

/**
 * Evaluates permission + online stream vs offline file availability (Section 8.2, DWN-01..09).
 */
export function resolveContentAccess(
  input: ResolveContentAccessInput
): ResolveContentAccessResult {
  const canOpenRes = resolveCanOpen(input.canOpenContext);

  if (!canOpenRes.allowed) {
    return {
      canOpen: false,
      resolutionMode: 'PAYWALL_LOCKED',
      reason: canOpenRes.reason,
    };
  }

  // Permitted to open. Now check delivery mode:
  if (input.hasDownloadedFile) {
    if (!input.isDownloadedVersionCurrent && input.isOnline) {
      return {
        canOpen: true,
        resolutionMode: 'UPDATE_AVAILABLE',
        reason: 'Downloaded file is playable, but a newer content version is available online.',
      };
    }
    return {
      canOpen: true,
      resolutionMode: 'OFFLINE_LOCAL',
      reason: 'Encrypted local downloaded copy available.',
    };
  }

  // No downloaded file on device:
  if (input.isOnline) {
    return {
      canOpen: true,
      resolutionMode: 'ONLINE_STREAM',
      reason: 'Streaming content in-memory over active connection (zero plain-text disk write).',
    };
  }

  return {
    canOpen: false,
    resolutionMode: 'NOT_AVAILABLE_OFFLINE',
    reason: 'Content is entitled but not downloaded, and device is offline.',
  };
}
