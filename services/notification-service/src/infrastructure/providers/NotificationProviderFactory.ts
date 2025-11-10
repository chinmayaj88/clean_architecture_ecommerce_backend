import { INotificationProvider } from '../../ports/interfaces/INotificationProvider';
import { MockNotificationProvider } from './MockNotificationProvider';
import { SendGridEmailProvider } from './SendGridEmailProvider';
import { NodemailerEmailProvider } from './NodemailerEmailProvider';
import { TwilioSmsProvider } from './TwilioSmsProvider';
import { getEnvConfig } from '../../config/env';
import { createLogger } from '../logging/logger';

const logger = createLogger();
const config = getEnvConfig();

export function createNotificationProvider(): INotificationProvider {
  const emailProvider = config.EMAIL_PROVIDER || 'mock';

  // For now, we'll create a composite provider that uses the appropriate provider for each channel
  // In a more advanced implementation, you might want separate providers for each channel
  try {
    switch (emailProvider) {
      case 'sendgrid':
        logger.info('Using SendGrid email provider');
        return new SendGridEmailProvider();
      case 'nodemailer':
        logger.info('Using Nodemailer email provider');
        return new NodemailerEmailProvider();
      case 'mock':
      default:
        logger.info('Using Mock notification provider');
        return new MockNotificationProvider();
    }
  } catch (error) {
    logger.error('Failed to create notification provider', {
      provider: emailProvider,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    logger.warn('Falling back to Mock notification provider');
    return new MockNotificationProvider();
  }
}

export function createEmailProvider(): INotificationProvider {
  const emailProvider = config.EMAIL_PROVIDER || 'mock';

  try {
    switch (emailProvider) {
      case 'sendgrid':
        return new SendGridEmailProvider();
      case 'nodemailer':
        return new NodemailerEmailProvider();
      case 'mock':
      default:
        return new MockNotificationProvider();
    }
  } catch (error) {
    logger.error('Failed to create email provider', {
      provider: emailProvider,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return new MockNotificationProvider();
  }
}

export function createSmsProvider(): INotificationProvider {
  const smsProvider = config.SMS_PROVIDER || 'mock';

  try {
    switch (smsProvider) {
      case 'twilio':
        return new TwilioSmsProvider();
      case 'mock':
      default:
        return new MockNotificationProvider();
    }
  } catch (error) {
    logger.error('Failed to create SMS provider', {
      provider: smsProvider,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return new MockNotificationProvider();
  }
}

