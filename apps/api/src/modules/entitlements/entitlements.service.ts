import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  EntitlementRecordDto,
  SignedEntitlementTokenPayloadDto,
} from '@mastera/contracts';

@Injectable()
export class EntitlementsService {
  private signingSecret: string;

  constructor() {
    this.signingSecret =
      process.env.ENTITLEMENT_SIGNING_SECRET ||
      'mastera_local_dev_entitlement_hmac_secret_44556677';
  }

  /**
   * Issues server-signed offline entitlement token (Section 7.1, R26).
   */
  issueSignedEntitlementToken(
    studentId: string,
    studentCode: string,
    deviceHardwareId: string,
    entitlements: EntitlementRecordDto[],
    tokenValidityDays: number = 30
  ): { token: string; payload: SignedEntitlementTokenPayloadDto } {
    const now = new Date();
    const tokenExpiry = new Date(
      now.getTime() + tokenValidityDays * 24 * 60 * 60 * 1000
    );

    const courseExpiries: Record<string, string> = {};
    for (const ent of entitlements) {
      if (ent.status === 'ACTIVE') {
        courseExpiries[ent.courseId] = ent.expiresAt;
      }
    }

    const payload: SignedEntitlementTokenPayloadDto = {
      studentId,
      studentCode,
      deviceHardwareId,
      issuedAtServerTime: now.toISOString(),
      tokenExpiresAt: tokenExpiry.toISOString(),
      courseExpiries,
    };

    const payloadJson = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', this.signingSecret)
      .update(payloadJson)
      .digest('hex');

    const token = `${Buffer.from(payloadJson).toString('base64url')}.${signature}`;

    return { token, payload };
  }
}
