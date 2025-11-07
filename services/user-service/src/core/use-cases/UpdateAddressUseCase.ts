/**
 * Update Address Use Case
 */

import { IAddressRepository } from '../../ports/interfaces/IAddressRepository';
import { UpdateAddressData, Address } from '../entities/Address';

export class UpdateAddressUseCase {
  constructor(
    private readonly addressRepository: IAddressRepository
  ) {}

  async execute(id: string, data: UpdateAddressData): Promise<Address> {
    return await this.addressRepository.update(id, data);
  }
}

