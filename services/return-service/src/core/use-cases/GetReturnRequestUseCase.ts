import { IReturnRequestRepository } from '../../ports/interfaces/IReturnRequestRepository';
import { IReturnItemRepository } from '../../ports/interfaces/IReturnItemRepository';
import { IReturnAuthorizationRepository } from '../../ports/interfaces/IReturnAuthorizationRepository';
import { IReturnStatusHistoryRepository } from '../../ports/interfaces/IReturnStatusHistoryRepository';
import { ReturnRequest } from '../../core/entities/ReturnRequest';

export interface GetReturnRequestInput {
  returnRequestId: string;
  includeItems?: boolean;
  includeAuthorization?: boolean;
  includeHistory?: boolean;
}

export interface ReturnRequestWithDetails extends ReturnRequest {
  items?: any[];
  authorization?: any;
  history?: any[];
}

export class GetReturnRequestUseCase {
  constructor(
    private readonly returnRequestRepository: IReturnRequestRepository,
    private readonly returnItemRepository: IReturnItemRepository,
    private readonly authorizationRepository: IReturnAuthorizationRepository,
    private readonly statusHistoryRepository: IReturnStatusHistoryRepository
  ) {}

  async execute(input: GetReturnRequestInput): Promise<ReturnRequestWithDetails | null> {
    const returnRequest = await this.returnRequestRepository.findById(input.returnRequestId);
    if (!returnRequest) {
      return null;
    }

    const result: ReturnRequestWithDetails = { ...returnRequest };

    if (input.includeItems) {
      result.items = await this.returnItemRepository.findByReturnRequestId(returnRequest.id);
    }

    if (input.includeAuthorization) {
      result.authorization = await this.authorizationRepository.findByReturnRequestId(returnRequest.id) || undefined;
    }

    if (input.includeHistory) {
      result.history = await this.statusHistoryRepository.findByReturnRequestId(returnRequest.id);
    }

    return result;
  }
}

