import { IShipmentRepository } from '../../ports/interfaces/IShipmentRepository';
import { IShippingMethodRepository } from '../../ports/interfaces/IShippingMethodRepository';
import { ICarrierRepository } from '../../ports/interfaces/ICarrierRepository';
import { Shipment, ShipmentStatus, Address } from '../../core/entities/Shipment';
import { v4 as uuidv4 } from 'uuid';

export interface CreateShipmentInput {
  orderId: string;
  methodId: string;
  weight: number;
  originAddress: Address;
  destinationAddress: Address;
  trackingNumber?: string;
}

export class CreateShipmentUseCase {
  constructor(
    private readonly shipmentRepository: IShipmentRepository,
    private readonly shippingMethodRepository: IShippingMethodRepository,
    private readonly carrierRepository: ICarrierRepository
  ) {}

  async execute(input: CreateShipmentInput): Promise<Shipment> {
    // Get shipping method
    const method = await this.shippingMethodRepository.findById(input.methodId);
    if (!method) {
      throw new Error('Shipping method not found');
    }

    if (!method.isActive) {
      throw new Error('Shipping method is not active');
    }

    // Get carrier if method has one
    let carrierId: string | null = null;
    if (method.carrier !== 'custom') {
      const carrier = await this.carrierRepository.findByCode(method.carrier);
      if (carrier) {
        carrierId = carrier.id;
      }
    }

    // Generate tracking number if not provided
    const trackingNumber = input.trackingNumber || this.generateTrackingNumber(method.carrier);

    // Calculate shipping cost (simplified - should use rate calculation)
    const cost = method.calculateCost(input.weight, 1, 0);

    // Create shipment
    const shipment = await this.shipmentRepository.create({
      orderId: input.orderId,
      carrierId,
      methodId: input.methodId,
      trackingNumber,
      status: ShipmentStatus.PENDING,
      weight: input.weight,
      cost,
      originAddress: input.originAddress,
      destinationAddress: input.destinationAddress,
      estimatedDeliveryDate: this.calculateEstimatedDelivery(method.estimatedDays),
    });

    return shipment;
  }

  private generateTrackingNumber(carrier: string): string {
    // Generate a mock tracking number
    const prefix = carrier.toUpperCase().substring(0, 4);
    const random = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
    return `${prefix}${random}`;
  }

  private calculateEstimatedDelivery(estimatedDays: number | null): Date | null {
    if (!estimatedDays) {
      return null;
    }
    const date = new Date();
    date.setDate(date.getDate() + estimatedDays);
    return date;
  }
}

