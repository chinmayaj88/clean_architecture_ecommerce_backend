import { ShippingMethod } from '../../core/entities/ShippingMethod';

export interface CreateShippingMethodData {
  zoneId: string;
  name: string;
  carrier: string;
  serviceType: string;
  basePrice: number;
  pricePerKg?: number | null;
  pricePerItem?: number | null;
  estimatedDays?: number | null;
  isActive?: boolean;
  configuration?: Record<string, any> | null;
}

export interface UpdateShippingMethodData {
  name?: string;
  carrier?: string;
  serviceType?: string;
  basePrice?: number;
  pricePerKg?: number | null;
  pricePerItem?: number | null;
  estimatedDays?: number | null;
  isActive?: boolean;
  configuration?: Record<string, any> | null;
}

export interface IShippingMethodRepository {
  create(data: CreateShippingMethodData): Promise<ShippingMethod>;
  findById(id: string): Promise<ShippingMethod | null>;
  findByZoneId(zoneId: string, activeOnly?: boolean): Promise<ShippingMethod[]>;
  findAll(activeOnly?: boolean): Promise<ShippingMethod[]>;
  update(id: string, data: UpdateShippingMethodData): Promise<ShippingMethod>;
  delete(id: string): Promise<void>;
}

