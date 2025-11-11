import { IReturnRequestRepository } from '../../ports/interfaces/IReturnRequestRepository';
import { IReturnAuthorizationRepository } from '../../ports/interfaces/IReturnAuthorizationRepository';
import { IReturnStatusHistoryRepository } from '../../ports/interfaces/IReturnStatusHistoryRepository';
import { ReturnRequest, ReturnStatus } from '../../core/entities/ReturnRequest';
import { ReturnAddress } from '../../core/entities/ReturnAuthorization';

export interface ApproveReturnRequestInput {
  returnRequestId: string;
  changedBy: string;
  returnAddress: ReturnAddress;
  returnInstructions?: string | null;
  expiresInDays?: number;
}

export class ApproveReturnRequestUseCase {
  constructor(
    private readonly returnRequestRepository: IReturnRequestRepository,
    private readonly authorizationRepository: IReturnAuthorizationRepository,
    private readonly statusHistoryRepository: IReturnStatusHistoryRepository
  ) {}

  async execute(input: ApproveReturnRequestInput): Promise<ReturnRequest> {
    const returnRequest = await this.returnRequestRepository.findById(input.returnRequestId);
    if (!returnRequest) {
      throw new Error('Return request not found');
    }

    if (returnRequest.status !== ReturnStatus.PENDING) {
      throw new Error(`Cannot approve return request with status: ${returnRequest.status}`);
    }

    // Create return authorization
    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

    await this.authorizationRepository.create({
      returnRequestId: returnRequest.id,
      rmaNumber: returnRequest.rmaNumber,
      returnAddress: input.returnAddress,
      returnInstructions: input.returnInstructions || null,
      expiresAt,
    });

    // Update return request status
    const updated = await this.returnRequestRepository.update(returnRequest.id, {
      status: ReturnStatus.APPROVED,
      approvedAt: new Date(),
    });

    // Add status history
    await this.statusHistoryRepository.create({
      returnRequestId: returnRequest.id,
      status: ReturnStatus.APPROVED,
      previousStatus: ReturnStatus.PENDING,
      changedBy: input.changedBy,
      notes: 'Return request approved',
    });

    return updated;
  }
}

