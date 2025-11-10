import { INotificationProvider, SendEmailRequest, SendEmailResponse, SendSmsRequest, SendSmsResponse, SendPushRequest, SendPushResponse } from '../../ports/interfaces/INotificationProvider';
import { createLogger } from '../logging/logger';

const logger = createLogger();

export class MockNotificationProvider implements INotificationProvider {
  getName(): string {
    return 'mock';
  }

  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    logger.info('Mock email sent', {
      to: request.to,
      subject: request.subject,
      provider: 'mock',
    });

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      success: true,
      messageId: `mock-email-${Date.now()}`,
      providerResponse: {
        to: request.to,
        subject: request.subject,
        sentAt: new Date().toISOString(),
      },
    };
  }

  async sendSms(request: SendSmsRequest): Promise<SendSmsResponse> {
    logger.info('Mock SMS sent', {
      to: request.to,
      provider: 'mock',
    });

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      success: true,
      messageId: `mock-sms-${Date.now()}`,
      providerResponse: {
        to: request.to,
        sentAt: new Date().toISOString(),
      },
    };
  }

  async sendPush(request: SendPushRequest): Promise<SendPushResponse> {
    logger.info('Mock push notification sent', {
      userId: request.userId,
      title: request.title,
      provider: 'mock',
    });

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      success: true,
      messageId: `mock-push-${Date.now()}`,
      providerResponse: {
        userId: request.userId,
        title: request.title,
        sentAt: new Date().toISOString(),
      },
    };
  }
}



