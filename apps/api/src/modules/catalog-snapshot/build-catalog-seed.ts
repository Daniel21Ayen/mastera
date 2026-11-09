import * as zlib from 'zlib';
import { CatalogSnapshotResponseDto } from '@mastera/contracts';

export const MAX_SEED_COMPRESSED_BYTES = 150 * 1024; // 150 KB hard cap (Section 2.5, 8.3, R20)

export interface SeedBuildResult {
  uncompressedBytes: number;
  compressedBytes: number;
  gzipBuffer: Buffer;
}

export function buildAndVerifyCatalogSeed(
  snapshot: CatalogSnapshotResponseDto
): SeedBuildResult {
  const jsonString = JSON.stringify(snapshot);
  const uncompressedBuffer = Buffer.from(jsonString, 'utf8');
  const gzipBuffer = zlib.gzipSync(uncompressedBuffer, {
    level: zlib.constants.Z_BEST_COMPRESSION,
  });

  if (gzipBuffer.byteLength > MAX_SEED_COMPRESSED_BYTES) {
    throw new Error(
      `R20 VIOLATION: Compressed seed catalog is ${gzipBuffer.byteLength} bytes, exceeding the 150 KB (${MAX_SEED_COMPRESSED_BYTES} bytes) release gate.`
    );
  }

  return {
    uncompressedBytes: uncompressedBuffer.byteLength,
    compressedBytes: gzipBuffer.byteLength,
    gzipBuffer,
  };
}
