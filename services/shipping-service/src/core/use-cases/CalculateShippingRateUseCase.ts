import { IShippingZoneRepository } from '../../ports/interfaces/IShippingZoneRepository';
import { IShippingMethodRepository } from '../../ports/interfaces/IShippingMethodRepository';
import { IShippingRateRepository } from '../../ports/interfaces/IShippingRateRepository';
import { ShippingMethod } from '../../core/entities/ShippingMethod';

export interface CalculateShippingRateInput {
  countryCode: string;
  stateCode?: string;
  postalCode?: string;
  weight: number; // in kg
  orderAmount: number;
  itemCount?: number;
}

export interface ShippingRateResult {
  methodId: string;
  methodName: string;
  carrier: string;
  serviceType: string;
  cost: number;
  estimatedDays: number | null;
}

export class CalculateShippingRateUseCase {
  constructor(
    private readonly shippingZoneRepository: IShippingZoneRepository,
    private readonly shippingMethodRepository: IShippingMethodRepository,
    private readonly shippingRateRepository: IShippingRateRepository
  ) {}

  async execute(input: CalculateShippingRateInput): Promise<ShippingRateResult[]> {
    // Find matching zones
    const zones = await this.shippingZoneRepository.findByLocation(
      input.countryCode,
      input.stateCode,
      input.postalCode
    );

    if (zones.length === 0) {
      return [];
    }

    // Get all methods for matching zones
    const allMethods: ShippingMethod[] = [];
    for (const zone of zones) {
      const methods = await this.shippingMethodRepository.findByZoneId(zone.id, true);
      allMethods.push(...methods);
    }

    // Calculate rates for each method
    const results: ShippingRateResult[] = [];

    for (const method of allMethods) {
      // Find matching rate
      const rate = await this.shippingRateRepository.findMatchingRate(
        method.id,
        input.weight,
        input.orderAmount
      );

      if (!rate) {
        continue; // Skip if no matching rate
      }

      // Calculate total cost
      const itemCount = input.itemCount || 1;
      const cost = method.calculateCost(input.weight, itemCount, Number(rate.rate));

      results.push({
        methodId: method.id,
        methodName: method.name,
        carrier: method.carrier,
        serviceType: method.serviceType,
        cost,
        estimatedDays: method.estimatedDays,
      });
    }

    // Sort by cost (cheapest first)
    return results.sort((a, b) => a.cost - b.cost);
  }
}

