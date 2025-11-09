import { ICartRepository } from '../../ports/interfaces/ICartRepository';
import { ICartItemRepository } from '../../ports/interfaces/ICartItemRepository';
import { CartItem } from '../../core/entities/CartItem';
import { CartCalculationService } from '../services/CartCalculationService';
import { getEnvConfig } from '../../config/env';
import { createLogger } from '../../infrastructure/logging/logger';

const logger = createLogger();
const config = getEnvConfig();

export interface UpdateCartItemInput {
  cartId: string;
  itemId: string;
  quantity: number;
}

export class UpdateCartItemUseCase {
  private cartCalculationService: CartCalculationService;

  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly cartItemRepository: ICartItemRepository
  ) {
    this.cartCalculationService = new CartCalculationService();
  }

  async execute(input: UpdateCartItemInput): Promise<CartItem> {
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

    // Validate quantity
    if (input.quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    if (input.quantity > config.MAX_ITEM_QUANTITY) {
      throw new Error(`Quantity cannot exceed ${config.MAX_ITEM_QUANTITY}`);
    }

    // Update item
    item.updateQuantity(input.quantity);
    const updatedItem = await this.cartItemRepository.update(item.id, {
      quantity: input.quantity,
      totalPrice: item.totalPrice,
    });

    // Recalculate cart totals
    await this.recalculateCartTotals(cart.id);

    logger.info('Cart item updated', {
      cartId: cart.id,
      itemId: updatedItem.id,
      quantity: input.quantity,
    });

    return updatedItem;
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

