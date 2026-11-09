import { SignedEntitlementTokenPayloadDto } from '@mastera/contracts';
import {
  hmacSha256Hex,
  timingSafeEqual,
  base64DecodeToString,
} from '../crypto/portable-crypto';

export function verifyOfflineEntitlementToken(
  signedTokenString: string,
  secretKey: string,
  currentDeviceTimeIso: string,
  deviceHardwareId: string,
  courseId: string
): { valid: boolean; reason: string } {
  const parts = signedTokenString.split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'Malformed entitlement token structure.' };
  }

  const [encodedPayload, signatureHex] = parts;
  if (!encodedPayload || !signatureHex) {
    return { valid: false, reason: 'Invalid token payload or signature.' };
  }

  // Verify HMAC-SHA256 signature
  const expectedSig = hmacSha256Hex(secretKey, encodedPayload);

  if (!timingSafeEqual(signatureHex, expectedSig)) {
    return { valid: false, reason: 'Invalid entitlement token signature.' };
  }

  let payload: SignedEntitlementTokenPayloadDto;
  try {
    payload = JSON.parse(base64DecodeToString(encodedPayload)) as SignedEntitlementTokenPayloadDto;
  } catch {
    return { valid: false, reason: 'Failed to parse entitlement token payload.' };
  }

  // Verify device binding
  if (payload.deviceHardwareId !== deviceHardwareId) {
    return { valid: false, reason: 'Device binding mismatch.' };
  }

  // Verify token expiration
  const tokenExpiresAtMs = new Date(payload.tokenExpiresAt).getTime();
  const currentDeviceMs = new Date(currentDeviceTimeIso).getTime();
  if (currentDeviceMs > tokenExpiresAtMs) {
    return { valid: false, reason: 'Offline entitlement token has expired.' };
  }

  // Verify specific course entitlement expiry
  const courseExpiryIso = payload.courseExpiries[courseId];
  if (!courseExpiryIso) {
    return { valid: false, reason: 'Course not found in signed entitlement token.' };
  }

  const courseExpiryMs = new Date(courseExpiryIso).getTime();
  if (currentDeviceMs > courseExpiryMs) {
    return { valid: false, reason: 'Course entitlement has expired.' };
  }

  return { valid: true, reason: 'Offline entitlement is valid.' };
}