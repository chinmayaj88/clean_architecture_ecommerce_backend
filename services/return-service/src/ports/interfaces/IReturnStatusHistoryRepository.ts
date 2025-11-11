import { ReturnStatusHistory } from '../../core/entities/ReturnStatusHistory';

export interface CreateStatusHistoryData {
  returnRequestId: string;
  status: string;
  previousStatus?: string | null;
  changedBy: string;
  notes?: string | null;
}

export interface IReturnStatusHistoryRepository {
  create(data: CreateStatusHistoryData): Promise<ReturnStatusHistory>;
  findByReturnRequestId(returnRequestId: string): Promise<ReturnStatusHistory[]>;
}

