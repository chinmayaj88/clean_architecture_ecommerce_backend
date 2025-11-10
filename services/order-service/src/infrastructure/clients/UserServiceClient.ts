import axios, { AxiosInstance } from 'axios';
import { IUserServiceClient, UserAddressInfo } from '../../ports/interfaces/IUserServiceClient';
import { getEnvConfig } from '../../config/env';
import { createLogger } from '../logging/logger';
import { retry } from '../utils/retry.util';
import { getCircuitBreaker } from '../utils/circuitBreaker.util';

const logger = createLogger();
const config = getEnvConfig();
const circuitBreaker = getCircuitBreaker('user-service', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 10000,
  resetTimeout: 60000,
});

export class UserServiceClient implements IUserServiceClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: config.USER_SERVICE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getUserAddress(addressId: string, userId: string, token?: string): Promise<UserAddressInfo | null> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await circuitBreaker.execute(() =>
        retry(
          () => this.axiosInstance.get(`/api/v1/users/${userId}/addresses/${addressId}`, { headers }),
          { maxRetries: 3, retryDelay: 1000 }
        )
      );

      if (response.data.success && response.data.data) {
        const address = response.data.data;
        return {
          id: address.id,
          userId: address.userId,
          firstName: address.firstName,
          lastName: address.lastName,
          company: address.company,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          phone: address.phone,
          isDefault: address.isDefault || false,
          type: address.type || 'shipping',
        };
      }

      return null;
    } catch (error: any) {
      logger.warn(`Failed to fetch address ${addressId}`, {
        error: error.message,
        status: error.response?.status,
      });
      return null;
    }
  }

  async getUserDefaultShippingAddress(userId: string, token?: string): Promise<UserAddressInfo | null> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await circuitBreaker.execute(() =>
        retry(
          () => this.axiosInstance.get(`/api/v1/users/${userId}/addresses`, { headers }),
          { maxRetries: 3, retryDelay: 1000 }
        )
      );

      if (response.data.success && response.data.data) {
        const addresses = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
        const defaultAddress = addresses.find((addr: any) => 
          addr.isDefault && (addr.type === 'shipping' || addr.type === 'both')
        );

        if (defaultAddress) {
          return {
            id: defaultAddress.id,
            userId: defaultAddress.userId,
            firstName: defaultAddress.firstName,
            lastName: defaultAddress.lastName,
            company: defaultAddress.company,
            addressLine1: defaultAddress.addressLine1,
            addressLine2: defaultAddress.addressLine2,
            city: defaultAddress.city,
            state: defaultAddress.state,
            postalCode: defaultAddress.postalCode,
            country: defaultAddress.country,
            phone: defaultAddress.phone,
            isDefault: defaultAddress.isDefault || false,
            type: defaultAddress.type || 'shipping',
          };
        }
      }

      return null;
    } catch (error: any) {
      logger.warn(`Failed to fetch default shipping address for user ${userId}`, {
        error: error.message,
        status: error.response?.status,
      });
      return null;
    }
  }
}

