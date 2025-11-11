import { IReturnRequestRepository } from '../../ports/interfaces/IReturnRequestRepository';
import { IReturnItemRepository } from '../../ports/interfaces/IReturnItemRepository';
import { IReturnStatusHistoryRepository } from '../../ports/interfaces/IReturnStatusHistoryRepository';
import { ReturnRequest, ReturnStatus } from '../../core/entities/ReturnRequest';

export interface CreateReturnRequestInput {
  orderId: string;
  userId: string;
  returnReason: string;
  returnNotes?: string | null;
  refundMethod: string;
  items: Array<{
    orderItemId: string;
    productId: string;
    variantId?: string | null;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    returnReason?: string | null;
    condition: string;
  }>;
}

export class CreateReturnRequestUseCase {
  constructor(
    private readonly returnRequestRepository: IReturnRequestRepository,
    private readonly returnItemRepository: IReturnItemRepository,
    private readonly statusHistoryRepository: IReturnStatusHistoryRepository
  ) {}

  async execute(input: CreateReturnRequestInput): Promise<ReturnRequest> {
    // Check if return already exists for this order
    const existingReturns = await this.returnRequestRepository.findByOrderId(input.orderId);
    if (existingReturns.length > 0) {
      const pendingReturn = existingReturns.find(r => r.status === ReturnStatus.PENDING);
      if (pendingReturn) {
        throw new Error('A pending return request already exists for this order');
      }
    }

    // Generate RMA number
    const rmaNumber = this.generateRMANumber();

    // Calculate total refund amount
    const refundAmount = input.items.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity);
    }, 0);

    // Create return request
    const returnRequest = await this.returnRequestRepository.create({
      orderId: input.orderId,
      userId: input.userId,
      rmaNumber,
      returnReason: input.returnReason,
      returnNotes: input.returnNotes || null,
      refundMethod: input.refundMethod,
      refundAmount,
      currency: 'USD',
    });

    // Create return items
    for (const item of input.items) {
      await this.returnItemRepository.create({
        returnRequestId: returnRequest.id,
        orderItemId: item.orderItemId,
        productId: item.productId,
        variantId: item.variantId || null,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        refundAmount: item.unitPrice * item.quantity,
        returnReason: item.returnReason || null,
        condition: item.condition,
      });
    }

    // Create initial status history
    await this.statusHistoryRepository.create({
      returnRequestId: returnRequest.id,
      status: ReturnStatus.PENDING,
      previousStatus: null,
      changedBy: input.userId,
      notes: 'Return request created',
    });

    return returnRequest;
  }

  private generateRMANumber(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RMA-${year}-${random}`;
  }
}

