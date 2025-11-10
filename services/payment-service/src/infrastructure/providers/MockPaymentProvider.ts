import { IPaymentProvider, ChargeRequest, ChargeResponse, RefundRequest, RefundResponse } from '../../ports/interfaces/IPaymentProvider';
import { PaymentProvider } from '../../core/entities/Payment';
import { createLogger } from '../logging/logger';

const logger = createLogger();

export class MockPaymentProvider implements IPaymentProvider {
  getName(): PaymentProvider {
    return PaymentProvider.MOCK;
  }

  async charge(request: ChargeRequest): Promise<ChargeResponse> {
    logger.info('Mock payment provider: Processing charge', {
      amount: request.amount,
      currency: request.currency,
      orderId: request.orderId,
    });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock: 90% success rate
    const success = Math.random() > 0.1;

    if (success) {
      const transactionId = `mock_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        transactionId,
        status: 'succeeded',
        providerResponse: {
          id: transactionId,
          amount: request.amount,
          currency: request.currency,
          status: 'succeeded',
          created: new Date().toISOString(),
        },
      };
    } else {
      return {
        success: false,
        transactionId: `mock_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'failed',
        error: 'Insufficient funds (mock)',
        providerResponse: {
          status: 'failed',
          error: 'Insufficient funds',
        },
      };
    }
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    logger.info('Mock payment provider: Processing refund', {
      paymentId: request.paymentId,
      amount: request.amount,
    });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const refundId = `mock_refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      refundId,
      status: 'completed',
      providerResponse: {
        id: refundId,
        paymentId: request.paymentId,
        amount: request.amount,
        status: 'completed',
        created: new Date().toISOString(),
      },
    };
  }
}

