import { IPaymentProvider } from '../../ports/interfaces/IPaymentProvider';
import { MockPaymentProvider } from './MockPaymentProvider';
import { StripePaymentProvider } from './StripePaymentProvider';
import { PayPalPaymentProvider } from './PayPalPaymentProvider';
import { PaymentProvider } from '../../core/entities/Payment';
import { getEnvConfig } from '../../config/env';
import { createLogger } from '../logging/logger';

const logger = createLogger();
const config = getEnvConfig();

export function createPaymentProvider(): IPaymentProvider {
  const provider = config.PAYMENT_PROVIDER || 'mock';

  try {
    switch (provider) {
      case 'mock':
        logger.info('Using Mock Payment Provider');
        return new MockPaymentProvider();
      
      case 'stripe':
        logger.info('Using Stripe Payment Provider');
        return new StripePaymentProvider();
      
      case 'paypal':
        logger.info('Using PayPal Payment Provider');
        return new PayPalPaymentProvider();
      
      default:
        logger.warn(`Unknown payment provider: ${provider}, using mock`);
        return new MockPaymentProvider();
    }
  } catch (error) {
    logger.error('Failed to create payment provider', {
      provider,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    logger.warn('Falling back to Mock Payment Provider');
    return new MockPaymentProvider();
  }
}

export function getPaymentProviderByName(name: PaymentProvider): IPaymentProvider {
  try {
    switch (name) {
      case PaymentProvider.MOCK:
        return new MockPaymentProvider();
      
      case PaymentProvider.STRIPE:
        logger.info('Using Stripe Payment Provider');
        return new StripePaymentProvider();
      
      case PaymentProvider.PAYPAL:
        logger.info('Using PayPal Payment Provider');
        return new PayPalPaymentProvider();
      
      default:
        logger.warn(`Unknown payment provider: ${name}, using mock`);
        return new MockPaymentProvider();
    }
  } catch (error) {
    logger.error('Failed to create payment provider by name', {
      provider: name,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    logger.warn('Falling back to Mock Payment Provider');
    return new MockPaymentProvider();
  }
}

