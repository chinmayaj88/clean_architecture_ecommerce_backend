import { IShipmentRepository } from '../../ports/interfaces/IShipmentRepository';
import { IShipmentTrackingRepository } from '../../ports/interfaces/IShipmentTrackingRepository';
import { Shipment, ShipmentStatus } from '../../core/entities/Shipment';

export interface UpdateShipmentStatusInput {
  shipmentId: string;
  status: ShipmentStatus;
  location?: string;
  description?: string;
  carrierData?: Record<string, any>;
}

export class UpdateShipmentStatusUseCase {
  constructor(
    private readonly shipmentRepository: IShipmentRepository,
    private readonly shipmentTrackingRepository: IShipmentTrackingRepository
  ) {}

  async execute(input: UpdateShipmentStatusInput): Promise<Shipment> {
    // Get shipment
    const shipment = await this.shipmentRepository.findById(input.shipmentId);
    if (!shipment) {
      throw new Error('Shipment not found');
    }

    // Check if status transition is valid
    if (!shipment.canTransitionTo(input.status)) {
      throw new Error(`Cannot transition from ${shipment.status} to ${input.status}`);
    }

    // Update shipment status
    const updateData: any = {
      status: input.status,
    };

    if (input.status === ShipmentStatus.IN_TRANSIT && !shipment.shippedAt) {
      updateData.shippedAt = new Date();
    }

    if (input.status === ShipmentStatus.DELIVERED && !shipment.deliveredAt) {
      updateData.deliveredAt = new Date();
    }

    const updatedShipment = await this.shipmentRepository.update(input.shipmentId, updateData);

    // Create tracking record
    await this.shipmentTrackingRepository.create({
      shipmentId: input.shipmentId,
      status: input.status,
      location: input.location || null,
      description: input.description || null,
      timestamp: new Date(),
      carrierData: input.carrierData || null,
    });

    return updatedShipment;
  }
}

