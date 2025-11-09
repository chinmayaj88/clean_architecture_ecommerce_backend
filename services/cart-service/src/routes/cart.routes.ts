import { Router } from 'express';
import { CartController } from '../application/controllers/CartController';
import { optionalAuth, authenticate } from '../middleware/auth.middleware';

export function createCartRoutes(cartController: CartController): Router {
  const router = Router();

  // All cart routes support optional auth (for guest carts)
  router.use(optionalAuth);

  // Create cart
  router.post('/', cartController.createCart.bind(cartController));

  // Get cart (by userId or sessionId - no cartId) - must come before /:cartId
  router.get('/', cartController.getCart.bind(cartController));
  
  // Get cart (by ID)
  router.get('/:cartId', cartController.getCart.bind(cartController));

  // Add item to cart
  router.post('/:cartId/items', cartController.addItem.bind(cartController));

  // Update cart item
  router.put('/:cartId/items/:itemId', cartController.updateItem.bind(cartController));

  // Remove item from cart
  router.delete('/:cartId/items/:itemId', cartController.removeItem.bind(cartController));

  // Clear cart
  router.delete('/:cartId', cartController.clearCart.bind(cartController));

  // Merge carts (requires authentication)
  router.post('/merge', authenticate, cartController.mergeCarts.bind(cartController));

  return router;
}

