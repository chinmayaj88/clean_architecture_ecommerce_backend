
import { IAddressRepository } from '../../ports/interfaces/IAddressRepository';
import { CreateAddressData, Address } from '../entities/Address';

export class CreateAddressUseCase {
  constructor(
    private readonly addressRepository: IAddressRepository
  ) {}

  async execute(data: CreateAddressData): Promise<Address> {
    return await this.addressRepository.create(data);
  }
}

