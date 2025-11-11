import { ShippingRate } from '../../core/entities/ShippingRate';

export interface CreateShippingRateData {
  methodId: string;
  minWeight: number;
  maxWeight?: number | null;
  minAmount: number;
  maxAmount?: number | null;
  rate: number;
}

export interface UpdateShippingRateData {
  minWeight?: number;
  maxWeight?: number | null;
  minAmount?: number;
  maxAmount?: number | null;
  rate?: number;
}

export interface IShippingRateRepository {
  create(data: CreateShippingRateData): Promise<ShippingRate>;
  findById(id: string): Promise<ShippingRate | null>;
  findByMethodId(methodId: string): Promise<ShippingRate[]>;
  findMatchingRate(methodId: string, weight: number, orderAmount: number): Promise<ShippingRate | null>;
  update(id: string, data: UpdateShippingRateData): Promise<ShippingRate>;
  delete(id: string): Promise<void>;
}

