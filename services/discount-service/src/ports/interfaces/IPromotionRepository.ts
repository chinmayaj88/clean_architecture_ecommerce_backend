import { Promotion } from '../../core/entities/Promotion';

export interface CreatePromotionData {
  name: string;
  description?: string | null;
  type: string;
  status?: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive?: boolean;
  configuration: Record<string, any>;
  metadata?: Record<string, any> | null;
}

export interface UpdatePromotionData {
  name?: string;
  description?: string | null;
  type?: string;
  status?: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive?: boolean;
  configuration?: Record<string, any>;
  metadata?: Record<string, any> | null;
}

export interface PromotionFilterOptions {
  status?: string;
  isActive?: boolean;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface IPromotionRepository {
  create(data: CreatePromotionData): Promise<Promotion>;
  findById(id: string): Promise<Promotion | null>;
  findAll(options?: PromotionFilterOptions): Promise<Promotion[]>;
  findActive(): Promise<Promotion[]>;
  update(id: string, data: UpdatePromotionData): Promise<Promotion>;
  delete(id: string): Promise<void>;
  activate(id: string): Promise<Promotion>;
  deactivate(id: string): Promise<Promotion>;
}

