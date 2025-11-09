import { Response } from 'express';
import { CreateCartUseCase } from '../../core/use-cases/CreateCartUseCase';
import { GetCartUseCase } from '../../core/use-cases/GetCartUseCase';
import { AddItemToCartUseCase } from '../../core/use-cases/AddItemToCartUseCase';
import { UpdateCartItemUseCase } from '../../core/use-cases/UpdateCartItemUseCase';
import { RemoveCartItemUseCase } from '../../core/use-cases/RemoveCartItemUseCase';
import { ClearCartUseCase } from '../../core/use-cases/ClearCartUseCase';
import { MergeCartsUseCase } from '../../core/use-cases/MergeCartsUseCase';
import { RequestWithId } from '../../middleware/requestId.middleware';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class CartController {
  constructor(
    private readonly createCartUseCase: CreateCartUseCase,
    private readonly getCartUseCase: GetCartUseCase,
    private readonly addItemToCartUseCase: AddItemToCartUseCase,
    private readonly updateCartItemUseCase: UpdateCartItemUseCase,
    private readonly removeCartItemUseCase: RemoveCartItemUseCase,
    private readonly clearCartUseCase: ClearCartUseCase,
    private readonly mergeCartsUseCase: MergeCartsUseCase
  ) {}

  async createCart(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || null;
      const sessionId = req.sessionId || null;

      // For authenticated users, use userId; for guests, use sessionId
      const cart = await this.createCartUseCase.execute({
        userId: userId || undefined,
        sessionId: sessionId || undefined,
        currency: req.body.currency || 'USD',
      });

      res.status(201).json({
        success: true,
        data: cart,
        requestId: req.id,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create cart',
        requestId: req.id,
      });
    }
  }

  async getCart(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const cartId = req.params.cartId;
      const userId = req.user?.userId || null;
      const sessionId = req.sessionId || null;

      const result = await this.getCartUseCase.execute({
        cartId: cartId || undefined,
        userId: userId || undefined,
        sessionId: sessionId || undefined,
      });

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Cart not found',
          requestId: req.id,
        });
        return;
      }

      res.json({
        success: true,
        data: {
          cart: result.cart,
          items: result.items,
        },
        requestId: req.id,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get cart',
        requestId: req.id,
      });
    }
  }

  async addItem(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const cartId = req.params.cartId;
      const { productId, variantId, quantity, metadata } = req.body;

      if (!productId || !quantity) {
        res.status(400).json({
          success: false,
          message: 'productId and quantity are required',
          requestId: req.id,
        });
        return;
      }

      const item = await this.addItemToCartUseCase.execute({
        cartId,
        productId,
        variantId: variantId || null,
        quantity,
        metadata,
      });

      res.status(201).json({
        success: true,
        data: item,
        requestId: req.id,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to add item to cart',
        requestId: req.id,
      });
    }
  }

  async updateItem(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const cartId = req.params.cartId;
      const itemId = req.params.itemId;
      const { quantity } = req.body;

      if (!quantity) {
        res.status(400).json({
          success: false,
          message: 'quantity is required',
          requestId: req.id,
        });
        return;
      }

      const item = await this.updateCartItemUseCase.execute({
        cartId,
        itemId,
        quantity,
      });

      res.json({
        success: true,
        data: item,
        requestId: req.id,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update cart item',
        requestId: req.id,
      });
    }
  }

  async removeItem(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const cartId = req.params.cartId;
      const itemId = req.params.itemId;

      await this.removeCartItemUseCase.execute({
        cartId,
        itemId,
      });

      res.json({
        success: true,
        message: 'Item removed from cart',
        requestId: req.id,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to remove cart item',
        requestId: req.id,
      });
    }
  }

  async clearCart(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const cartId = req.params.cartId;

      await this.clearCartUseCase.execute({
        cartId,
      });

      res.json({
        success: true,
        message: 'Cart cleared',
        requestId: req.id,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to clear cart',
        requestId: req.id,
      });
    }
  }

  async mergeCarts(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          requestId: req.id,
        });
        return;
      }

      const { guestSessionId } = req.body;
      if (!guestSessionId) {
        res.status(400).json({
          success: false,
          message: 'guestSessionId is required',
          requestId: req.id,
        });
        return;
      }

      const cart = await this.mergeCartsUseCase.execute({
        guestSessionId,
        userId,
      });

      res.json({
        success: true,
        data: cart,
        requestId: req.id,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to merge carts',
        requestId: req.id,
      });
    }
  }
}

