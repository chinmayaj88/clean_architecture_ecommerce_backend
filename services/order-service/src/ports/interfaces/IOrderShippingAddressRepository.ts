import { OrderShippingAddress } from '../../core/entities/OrderShippingAddress';

export interface CreateOrderShippingAddressData {
  orderId: string;
  firstName: string;
  lastName: string;
  company: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
}

export interface IOrderShippingAddressRepository {
  create(address: CreateOrderShippingAddressData): Promise<OrderShippingAddress>;
  findByOrderId(orderId: string): Promise<OrderShippingAddress | null>;
  update(orderId: string, data: Partial<CreateOrderShippingAddressData>): Promise<OrderShippingAddress>;
}

