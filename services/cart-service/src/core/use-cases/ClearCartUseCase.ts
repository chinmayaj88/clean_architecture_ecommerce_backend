import { ICartRepository } from '../../ports/interfaces/ICartRepository';
import { ICartItemRepository } from '../../ports/interfaces/ICartItemRepository';
import { createLogger } from '../../infrastructure/logging/logger';

const logger = createLogger();

export interface ClearCartInput {
  cartId: string;
}

export class ClearCartUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly cartItemRepository: ICartItemRepository
  ) {}

  async execute(input: ClearCartInput): Promise<void> {
    // Get cart
    const cart = await this.cartRepository.findById(input.cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    if (!cart.canBeModified()) {
      throw new Error('Cart cannot be modified');
    }

    // Delete all items
    await this.cartItemRepository.deleteByCartId(cart.id);

    // Reset cart totals
    await this.cartRepository.update(cart.id, {
      subtotal: 0,
      taxAmount: 0,
      shippingAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
      couponCode: null,
    });

    logger.info('Cart cleared', {
      cartId: cart.id,
    });
  }
}

