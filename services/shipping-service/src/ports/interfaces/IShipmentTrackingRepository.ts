import { ShipmentTracking } from '../../core/entities/ShipmentTracking';

export interface CreateShipmentTrackingData {
  shipmentId: string;
  status: string;
  location?: string | null;
  description?: string | null;
  timestamp: Date;
  carrierData?: Record<string, any> | null;
}

export interface IShipmentTrackingRepository {
  create(data: CreateShipmentTrackingData): Promise<ShipmentTracking>;
  findById(id: string): Promise<ShipmentTracking | null>;
  findByShipmentId(shipmentId: string): Promise<ShipmentTracking[]>;
  findLatestByShipmentId(shipmentId: string): Promise<ShipmentTracking | null>;
}

