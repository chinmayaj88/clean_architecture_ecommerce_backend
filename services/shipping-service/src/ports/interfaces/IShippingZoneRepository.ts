import { ShippingZone, ZoneType } from '../../core/entities/ShippingZone';

export interface CreateShippingZoneData {
  name: string;
  type: ZoneType;
  countries: string[];
  states?: string[] | null;
  postalCodes?: string[] | null;
  isActive?: boolean;
}

export interface UpdateShippingZoneData {
  name?: string;
  type?: ZoneType;
  countries?: string[];
  states?: string[] | null;
  postalCodes?: string[] | null;
  isActive?: boolean;
}

export interface IShippingZoneRepository {
  create(data: CreateShippingZoneData): Promise<ShippingZone>;
  findById(id: string): Promise<ShippingZone | null>;
  findAll(activeOnly?: boolean): Promise<ShippingZone[]>;
  findByLocation(countryCode: string, stateCode?: string, postalCode?: string): Promise<ShippingZone[]>;
  update(id: string, data: UpdateShippingZoneData): Promise<ShippingZone>;
  delete(id: string): Promise<void>;
}

