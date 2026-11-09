import { CatalogSnapshotResponseDto } from '@mastera/contracts';
import { LocalAuthManager } from '../security/local-auth-manager';
import { LocalCatalogSqliteStore } from '../database/local-catalog-store';

export type MobileSyncTrigger =
  | 'APP_FOREGROUNDED'
  | 'CONNECTION_RESTORED'
  | 'MANUAL_REFRESH';

export interface MobileSyncSnapshotResponse {
  notModified: boolean;
  etag?: string;
  snapshot?: CatalogSnapshotResponseDto;
}

export interface MobileSyncNetworkPort {
  fetchCatalogSnapshot(
    etag?: string,
    sinceVersion?: number
  ): Promise<MobileSyncSnapshotResponse>;
  pushRegisteredStudentOutbox(): Promise<void>;
}

export interface SyncResult {
  catalogUpdated: boolean;
  outboxFlushed: boolean;
}

export class MobileSyncEngine {
  private currentEtag: string | null = null;
  private pendingOutboxItems: unknown[] = [];

  constructor(
    private readonly auth: LocalAuthManager,
    private readonly store: LocalCatalogSqliteStore,
    private readonly networkPort: MobileSyncNetworkPort
  ) {}

  queueLocalProgressOutboxItem(item?: unknown): void {
    if (item !== undefined) {
      this.pendingOutboxItems.push(item);
    } else {
      this.pendingOutboxItems.push({ queuedAt: new Date().toISOString() });
    }
  }

  async triggerSync(
    trigger: MobileSyncTrigger,
    isOnline: boolean
  ): Promise<SyncResult> {
    if (!isOnline) {
      return { catalogUpdated: false, outboxFlushed: false };
    }

    let catalogUpdated = false;
    let outboxFlushed = false;

    try {
      const snapshotRes = await this.networkPort.fetchCatalogSnapshot(
        this.currentEtag ?? undefined,
        this.store.getSnapshotVersion()
      );

      if (!snapshotRes.notModified && snapshotRes.snapshot) {
        this.store.applyDeltaSnapshot(snapshotRes.snapshot);
        if (snapshotRes.etag) {
          this.currentEtag = snapshotRes.etag;
        }
        catalogUpdated = true;
      }
    } catch {
      // Offline fallback: keep existing cache
    }

    // Local-only student outbox MUST NOT flush before registration / first order (FR-A06, SYN-01)
    if (this.auth.canSendStudentDataToServer() && this.pendingOutboxItems.length > 0) {
      try {
        await this.networkPort.pushRegisteredStudentOutbox();
        this.pendingOutboxItems = [];
        outboxFlushed = true;
      } catch {
        // Retry next sync
      }
    }

    return { catalogUpdated, outboxFlushed };
  }
}
