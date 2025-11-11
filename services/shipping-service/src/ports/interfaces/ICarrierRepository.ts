import { Carrier } from '../../core/entities/Carrier';

export interface CreateCarrierData {
  name: string;
  code: string;
  apiEndpoint: string;
  apiKey: string; // Should be encrypted before storage
  isActive?: boolean;
  configuration?: Record<string, any> | null;
}

export interface UpdateCarrierData {
  name?: string;
  apiEndpoint?: string;
  apiKey?: string; // Should be encrypted before storage
  isActive?: boolean;
  configuration?: Record<string, any> | null;
}

export interface ICarrierRepository {
  create(data: CreateCarrierData): Promise<Carrier>;
  findById(id: string): Promise<Carrier | null>;
  findByCode(code: string): Promise<Carrier | null>;
  findAll(activeOnly?: boolean): Promise<Carrier[]>;
  update(id: string, data: UpdateCarrierData): Promise<Carrier>;
  delete(id: string): Promise<void>;
}

