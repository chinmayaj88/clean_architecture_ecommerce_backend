import { ReturnAuthorization, ReturnAddress } from '../../core/entities/ReturnAuthorization';

export interface CreateReturnAuthorizationData {
  returnRequestId: string;
  rmaNumber: string;
  returnAddress: ReturnAddress;
  returnInstructions?: string | null;
  trackingNumber?: string | null;
  expiresAt?: Date | null;
}

export interface UpdateReturnAuthorizationData {
  returnAddress?: ReturnAddress;
  returnInstructions?: string | null;
  trackingNumber?: string | null;
  expiresAt?: Date | null;
}

export interface IReturnAuthorizationRepository {
  create(data: CreateReturnAuthorizationData): Promise<ReturnAuthorization>;
  findById(id: string): Promise<ReturnAuthorization | null>;
  findByRmaNumber(rmaNumber: string): Promise<ReturnAuthorization | null>;
  findByReturnRequestId(returnRequestId: string): Promise<ReturnAuthorization | null>;
  update(id: string, data: UpdateReturnAuthorizationData): Promise<ReturnAuthorization>;
  delete(id: string): Promise<void>;
}

