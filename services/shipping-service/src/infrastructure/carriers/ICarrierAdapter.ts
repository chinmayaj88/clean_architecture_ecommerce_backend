import { Address } from '../../core/entities/Shipment';

export interface CreateShipmentRequest {
  serviceType: string;
  originAddress: Address;
  destinationAddress: Address;
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface CarrierResponse {
  trackingNumber: string;
  cost: number;
  estimatedDeliveryDate: Date | null;
  labelUrl?: string;
  rawResponse?: Record<string, any>;
}

export interface TrackingData {
  status: string;
  location: string | null;
  description: string | null;
  timestamp: Date;
  rawData?: Record<string, any>;
}

export interface ICarrierAdapter {
  createShipment(request: CreateShipmentRequest): Promise<CarrierResponse>;
  trackShipment(trackingNumber: string): Promise<TrackingData>;
  calculateRate(request: CreateShipmentRequest): Promise<number>;
}

