import { Injectable } from '@nestjs/common';

export interface PushNotificationPayload {
  to: string; // Expo push token: ExponentPushToken[...]
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class ExpoPushDispatcherService {
  /**
   * Dispatches push notification to student device for order approvals and expiry warnings.
   */
  async sendPushNotification(payload: PushNotificationPayload): Promise<boolean> {
    if (!payload.to || !payload.to.startsWith('ExponentPushToken[')) {
      return false;
    }

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
