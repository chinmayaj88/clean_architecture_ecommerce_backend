import { IReturnRequestRepository } from '../../ports/interfaces/IReturnRequestRepository';
import { IReturnStatusHistoryRepository } from '../../ports/interfaces/IReturnStatusHistoryRepository';
import { ReturnRequest, ReturnStatus } from '../../core/entities/ReturnRequest';

export interface UpdateReturnStatusInput {
  returnRequestId: string;
  status: ReturnStatus;
  changedBy: string;
  notes?: string | null;
}

export class UpdateReturnStatusUseCase {
  constructor(
    private readonly returnRequestRepository: IReturnRequestRepository,
    private readonly statusHistoryRepository: IReturnStatusHistoryRepository
  ) {}

  async execute(input: UpdateReturnStatusInput): Promise<ReturnRequest> {
    const returnRequest = await this.returnRequestRepository.findById(input.returnRequestId);
    if (!returnRequest) {
      throw new Error('Return request not found');
    }

    const previousStatus = returnRequest.status;

    // Validate status transition
    this.validateStatusTransition(previousStatus, input.status);

    // Prepare update data based on status
    const updateData: any = {
      status: input.status,
    };

    const now = new Date();
    switch (input.status) {
      case ReturnStatus.REJECTED:
        updateData.rejectedAt = now;
        break;
      case ReturnStatus.RECEIVED:
        updateData.receivedAt = now;
        break;
      case ReturnStatus.CLOSED:
        updateData.closedAt = now;
        break;
    }

    // Update return request
    const updated = await this.returnRequestRepository.update(input.returnRequestId, updateData);

    // Add status history
    await this.statusHistoryRepository.create({
      returnRequestId: input.returnRequestId,
      status: input.status,
      previousStatus,
      changedBy: input.changedBy,
      notes: input.notes || null,
    });

    return updated;
  }

  private validateStatusTransition(currentStatus: ReturnStatus, newStatus: ReturnStatus): void {
    const validTransitions: Record<ReturnStatus, ReturnStatus[]> = {
      [ReturnStatus.PENDING]: [ReturnStatus.APPROVED, ReturnStatus.REJECTED],
      [ReturnStatus.APPROVED]: [ReturnStatus.IN_TRANSIT, ReturnStatus.REJECTED],
      [ReturnStatus.REJECTED]: [],
      [ReturnStatus.IN_TRANSIT]: [ReturnStatus.RECEIVED],
      [ReturnStatus.RECEIVED]: [ReturnStatus.PROCESSED],
      [ReturnStatus.PROCESSED]: [ReturnStatus.CLOSED],
      [ReturnStatus.CLOSED]: [],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }
}

