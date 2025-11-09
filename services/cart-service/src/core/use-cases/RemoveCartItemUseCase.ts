import { ICartRepository } from '../../ports/interfaces/ICartRepository';
import { ICartItemRepository } from '../../ports/interfaces/ICartItemRepository';
import { CartCalculationService } from '../services/CartCalculationService';
import { createLogger } from '../../infrastructure/logging/logger';

const logger = createLogger();

export interface RemoveCartItemInput {
  cartId: string;
  itemId: string;
}

export class RemoveCartItemUseCase {
  private cartCalculationService: CartCalculationService;

  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly cartItemRepository: ICartItemRepository
  ) {
    this.cartCalculationService = new CartCalculationService();
  }

  async execute(input: RemoveCartItemInput): Promise<void> {
    // Get cart
    const cart = await this.cartRepository.findById(input.cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    if (!cart.canBeModified()) {
      throw new Error('Cart cannot be modified');
    }

    // Get cart item
    const item = await this.cartItemRepository.findById(input.itemId);
    if (!item) {
      throw new Error('Cart item not found');
    }

    if (item.cartId !== input.cartId) {
      throw new Error('Cart item does not belong to this cart');
    }

    // Delete item
    await this.cartItemRepository.delete(input.itemId);

    // Recalculate cart totals
    await this.recalculateCartTotals(cart.id);

    logger.info('Cart item removed', {
      cartId: cart.id,
      itemId: input.itemId,
    });
  }

  private async recalculateCartTotals(cartId: string): Promise<void> {
    const cart = await this.cartRepository.findById(cartId);
    if (!cart) {
      return;
    }

    const items = await this.cartItemRepository.findByCartId(cartId);
    const totals = this.cartCalculationService.recalculateCart(cart, items);

    await this.cartRepository.update(cartId, {
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      shippingAmount: totals.shippingAmount,
      discountAmount: totals.discountAmount,
      totalAmount: totals.totalAmount,
    });
  }
}

