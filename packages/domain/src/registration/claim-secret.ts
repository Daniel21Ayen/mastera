import { sha256Hex, timingSafeEqual } from '../crypto/portable-crypto';

export function hashClaimSecret(claimSecret: string): string {
  return sha256Hex(claimSecret);
}

export function verifyClaimSecret(providedSecret: string, storedHash: string): boolean {
  const hashedInput = hashClaimSecret(providedSecret);
  return timingSafeEqual(hashedInput, storedHash);
}