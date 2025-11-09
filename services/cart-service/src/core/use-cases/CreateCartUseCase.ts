import { ICartRepository } from '../../ports/interfaces/ICartRepository';
import { Cart, CartStatus } from '../../core/entities/Cart';
import { getEnvConfig } from '../../config/env';
import { createLogger } from '../../infrastructure/logging/logger';

const logger = createLogger();
const config = getEnvConfig();

export interface CreateCartInput {
  userId?: string;
  sessionId?: string;
  currency?: string;
}

export class CreateCartUseCase {
  constructor(private readonly cartRepository: ICartRepository) {}

  async execute(input: CreateCartInput): Promise<Cart> {
    // Validate that either userId or sessionId is provided
    if (!input.userId && !input.sessionId) {
      throw new Error('Either userId or sessionId must be provided');
    }

    // Check if cart already exists
    if (input.userId) {
      const existingCart = await this.cartRepository.findByUserId(input.userId, CartStatus.ACTIVE);
      if (existingCart && existingCart.isActive()) {
        logger.info('Active cart already exists for user', { userId: input.userId });
        return existingCart;
      }
    }

    if (input.sessionId) {
      const existingCart = await this.cartRepository.findBySessionId(input.sessionId, CartStatus.ACTIVE);
      if (existingCart && existingCart.isActive()) {
        logger.info('Active cart already exists for session', { sessionId: input.sessionId });
        return existingCart;
      }
    }

    // Calculate expiration date (default 30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.CART_EXPIRATION_DAYS);

    // Create new cart
    const cart = await this.cartRepository.create({
      userId: input.userId || null,
      sessionId: input.sessionId || null,
      status: CartStatus.ACTIVE,
      currency: input.currency || 'USD',
      subtotal: 0,
      taxAmount: 0,
      shippingAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
      couponCode: null,
      metadata: null,
      expiresAt: expiresAt,
      convertedAt: null,
    });

    logger.info('Cart created', {
      cartId: cart.id,
      userId: cart.userId,
      sessionId: cart.sessionId,
    });

    return cart;
  }
}

