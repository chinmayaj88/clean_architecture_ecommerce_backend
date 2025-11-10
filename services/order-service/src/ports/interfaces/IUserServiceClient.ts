export interface UserAddressInfo {
  id: string;
  userId: string;
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
  isDefault: boolean;
  type: string; // 'shipping' | 'billing' | 'both'
}

export interface IUserServiceClient {
  getUserAddress(addressId: string, userId: string, token?: string): Promise<UserAddressInfo | null>;
  getUserDefaultShippingAddress(userId: string, token?: string): Promise<UserAddressInfo | null>;
}

