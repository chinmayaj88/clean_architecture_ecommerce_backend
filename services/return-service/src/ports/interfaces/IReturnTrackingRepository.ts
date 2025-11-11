import { ReturnTracking } from '../../core/entities/ReturnTracking';

export interface CreateTrackingData {
  authorizationId: string;
  status: string;
  location?: string | null;
  description?: string | null;
  timestamp: Date;
  carrierData?: Record<string, any> | null;
}

export interface IReturnTrackingRepository {
  create(data: CreateTrackingData): Promise<ReturnTracking>;
  findByAuthorizationId(authorizationId: string): Promise<ReturnTracking[]>;
}

