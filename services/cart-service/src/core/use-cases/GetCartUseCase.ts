import { ICartRepository } from '../../ports/interfaces/ICartRepository';
import { ICartItemRepository } from '../../ports/interfaces/ICartItemRepository';
import { Cart } from '../../core/entities/Cart';
import { CartItem } from '../../core/entities/CartItem';

export interface GetCartInput {
  cartId?: string;
  userId?: string;
  sessionId?: string;
}

export interface GetCartOutput {
  cart: Cart;
  items: CartItem[];
}

export class GetCartUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly cartItemRepository: ICartItemRepository
  ) {}

  async execute(input: GetCartInput): Promise<GetCartOutput | null> {
    let cart: Cart | null = null;

    if (input.cartId) {
      cart = await this.cartRepository.findById(input.cartId);
    } else if (input.userId) {
      cart = await this.cartRepository.findByUserId(input.userId);
    } else if (input.sessionId) {
      cart = await this.cartRepository.findBySessionId(input.sessionId);
    }

    if (!cart) {
      return null;
    }

    // Get cart items
    const items = await this.cartItemRepository.findByCartId(cart.id);

    return {
      cart,
      items,
    };
  }
}

