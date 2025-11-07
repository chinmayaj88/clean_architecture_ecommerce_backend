/**
 * Get Addresses Use Case
 */

import { IAddressRepository } from '../../ports/interfaces/IAddressRepository';
import { Address } from '../entities/Address';

export class GetAddressesUseCase {
  constructor(
    private readonly addressRepository: IAddressRepository
  ) {}

  async execute(userId: string, type?: 'shipping' | 'billing' | 'both'): Promise<Address[]> {
    if (type) {
      return await this.addressRepository.findByUserIdAndType(userId, type);
    }
    return await this.addressRepository.findByUserId(userId);
  }
}

