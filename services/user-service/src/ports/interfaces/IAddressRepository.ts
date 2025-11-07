/**
 * Address Repository Interface - Port
 */

import { Address, CreateAddressData, UpdateAddressData } from '../../core/entities/Address';

export interface IAddressRepository {
  create(data: CreateAddressData): Promise<Address>;
  findById(id: string): Promise<Address | null>;
  findByUserId(userId: string): Promise<Address[]>;
  findByUserIdAndType(userId: string, type: 'shipping' | 'billing' | 'both'): Promise<Address[]>;
  findDefaultByUserId(userId: string, type: 'shipping' | 'billing'): Promise<Address | null>;
  update(id: string, data: UpdateAddressData): Promise<Address>;
  delete(id: string): Promise<void>;
  setAsDefault(userId: string, addressId: string, type: 'shipping' | 'billing'): Promise<void>;
}

