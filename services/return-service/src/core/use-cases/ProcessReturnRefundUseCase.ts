import { IReturnRequestRepository } from '../../ports/interfaces/IReturnRequestRepository';
import { IRefundRepository } from '../../ports/interfaces/IRefundRepository';
import { IReturnStatusHistoryRepository } from '../../ports/interfaces/IReturnStatusHistoryRepository';
import { ReturnRequest, ReturnStatus } from '../../core/entities/ReturnRequest';
import { Refund, RefundStatus } from '../../core/entities/Refund';

export interface ProcessReturnRefundInput {
  returnRequestId: string;
  paymentId?: string | null;
  changedBy: string;
}

export class ProcessReturnRefundUseCase {
  constructor(
    private readonly returnRequestRepository: IReturnRequestRepository,
    private readonly refundRepository: IRefundRepository,
    private readonly statusHistoryRepository: IReturnStatusHistoryRepository
  ) {}

  async execute(input: ProcessReturnRefundInput): Promise<Refund> {
    const returnRequest = await this.returnRequestRepository.findById(input.returnRequestId);
    if (!returnRequest) {
      throw new Error('Return request not found');
    }

    if (returnRequest.status !== ReturnStatus.RECEIVED) {
      throw new Error(`Cannot process refund for return request with status: ${returnRequest.status}`);
    }

    // Check if refund already exists
    const existingRefunds = await this.refundRepository.findByReturnRequestId(returnRequest.id);
    if (existingRefunds.length > 0) {
      throw new Error('Refund already exists for this return request');
    }

    // Create refund record
    const refund = await this.refundRepository.create({
      returnRequestId: returnRequest.id,
      paymentId: input.paymentId || null,
      orderId: returnRequest.orderId,
      userId: returnRequest.userId,
      refundMethod: returnRequest.refundMethod,
      amount: returnRequest.refundAmount,
      currency: returnRequest.currency,
      status: RefundStatus.PENDING,
      reason: `Return: ${returnRequest.returnReason}`,
    });

    // Update return request status
    await this.returnRequestRepository.update(returnRequest.id, {
      status: ReturnStatus.PROCESSED,
      processedAt: new Date(),
    });

    // Add status history
    await this.statusHistoryRepository.create({
      returnRequestId: returnRequest.id,
      status: ReturnStatus.PROCESSED,
      previousStatus: ReturnStatus.RECEIVED,
      changedBy: input.changedBy,
      notes: 'Refund processing initiated',
    });

    return refund;
  }
}

