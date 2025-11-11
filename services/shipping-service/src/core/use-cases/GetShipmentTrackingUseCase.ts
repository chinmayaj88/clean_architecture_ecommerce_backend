import { IShipmentRepository } from '../../ports/interfaces/IShipmentRepository';
import { IShipmentTrackingRepository } from '../../ports/interfaces/IShipmentTrackingRepository';
import { Shipment } from '../../core/entities/Shipment';
import { ShipmentTracking } from '../../core/entities/ShipmentTracking';

export interface TrackingInfo {
  shipment: Shipment;
  trackingHistory: ShipmentTracking[];
  latestStatus: ShipmentTracking | null;
}

export class GetShipmentTrackingUseCase {
  constructor(
    private readonly shipmentRepository: IShipmentRepository,
    private readonly shipmentTrackingRepository: IShipmentTrackingRepository
  ) {}

  async executeByTrackingNumber(trackingNumber: string): Promise<TrackingInfo | null> {
    const shipment = await this.shipmentRepository.findByTrackingNumber(trackingNumber);
    if (!shipment) {
      return null;
    }

    return this.getTrackingInfo(shipment);
  }

  async executeByShipmentId(shipmentId: string): Promise<TrackingInfo | null> {
    const shipment = await this.shipmentRepository.findById(shipmentId);
    if (!shipment) {
      return null;
    }

    return this.getTrackingInfo(shipment);
  }

  private async getTrackingInfo(shipment: Shipment): Promise<TrackingInfo> {
    const trackingHistory = await this.shipmentTrackingRepository.findByShipmentId(shipment.id);
    const latestStatus = await this.shipmentTrackingRepository.findLatestByShipmentId(shipment.id);

    return {
      shipment,
      trackingHistory,
      latestStatus,
    };
  }
}

