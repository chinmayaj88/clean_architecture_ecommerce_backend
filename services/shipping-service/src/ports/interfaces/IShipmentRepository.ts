import { Shipment, ShipmentStatus, Address } from '../../core/entities/Shipment';

export interface CreateShipmentData {
  orderId: string;
  carrierId?: string | null;
  methodId?: string | null;
  trackingNumber: string;
  status?: ShipmentStatus;
  weight: number;
  cost: number;
  originAddress: Address;
  destinationAddress: Address;
  estimatedDeliveryDate?: Date | null;
  carrierResponse?: Record<string, any> | null;
}

export interface UpdateShipmentData {
  carrierId?: string | null;
  methodId?: string | null;
  status?: ShipmentStatus;
  weight?: number;
  cost?: number;
  shippedAt?: Date | null;
  estimatedDeliveryDate?: Date | null;
  deliveredAt?: Date | null;
  carrierResponse?: Record<string, any> | null;
}

export interface ShipmentFilterOptions {
  orderId?: string;
  status?: ShipmentStatus;
  carrierId?: string;
  limit?: number;
  offset?: number;
}

export interface IShipmentRepository {
  create(data: CreateShipmentData): Promise<Shipment>;
  findById(id: string): Promise<Shipment | null>;
  findByTrackingNumber(trackingNumber: string): Promise<Shipment | null>;
  findByOrderId(orderId: string): Promise<Shipment[]>;
  findAll(options?: ShipmentFilterOptions): Promise<Shipment[]>;
  update(id: string, data: UpdateShipmentData): Promise<Shipment>;
  delete(id: string): Promise<void>;
}

