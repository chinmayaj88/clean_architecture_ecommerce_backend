import { ICartRepository } from '../../ports/interfaces/ICartRepository';
import { ICartItemRepository } from '../../ports/interfaces/ICartItemRepository';
import { Cart, CartStatus } from '../../core/entities/Cart';
import { AddItemToCartUseCase } from './AddItemToCartUseCase';
import { createLogger } from '../../infrastructure/logging/logger';
import { getEnvConfig } from '../../config/env';

const logger = createLogger();
const config = getEnvConfig();

export interface MergeCartsInput {
  guestSessionId: string;
  userId: string;
}

export class MergeCartsUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly cartItemRepository: ICartItemRepository,
    private readonly addItemToCartUseCase: AddItemToCartUseCase
  ) {}

  async execute(input: MergeCartsInput): Promise<Cart> {
    // Get guest cart
    const guestCart = await this.cartRepository.findBySessionId(input.guestSessionId);
    if (!guestCart) {
      // No guest cart, get or create user cart
      let userCart = await this.cartRepository.findByUserId(input.userId);
      if (!userCart) {
        // Create new user cart
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + config.CART_EXPIRATION_DAYS);
        userCart = await this.cartRepository.create({
          userId: input.userId,
          sessionId: null,
          status: CartStatus.ACTIVE,
          currency: 'USD',
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
      }
      return userCart;
    }

    // Get or create user cart
    let userCart = await this.cartRepository.findByUserId(input.userId);
    if (!userCart) {
      // Convert guest cart to user cart
      userCart = await this.cartRepository.update(guestCart.id, {
        userId: input.userId,
        sessionId: null,
      });

      logger.info('Guest cart converted to user cart', {
        cartId: userCart.id,
        userId: input.userId,
      });

      return userCart;
    }

    // Merge items from guest cart to user cart
    const guestItems = await this.cartItemRepository.findByCartId(guestCart.id);
    
    for (const item of guestItems) {
      try {
        // Try to add item to user cart (will update quantity if already exists)
        await this.addItemToCartUseCase.execute({
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          metadata: item.metadata as Record<string, any> | undefined,
        });
      } catch (error: any) {
        // Log error but continue merging other items
        logger.warn('Failed to merge cart item', {
          error: error.message,
          cartId: userCart.id,
          productId: item.productId,
        });
      }
    }

    // Delete guest cart
    await this.cartRepository.delete(guestCart.id);

    logger.info('Carts merged', {
      guestCartId: guestCart.id,
      userCartId: userCart.id,
      userId: input.userId,
      itemsMerged: guestItems.length,
    });

    // Get updated user cart
    const updatedCart = await this.cartRepository.findById(userCart.id);
    return updatedCart!;
  }
}

