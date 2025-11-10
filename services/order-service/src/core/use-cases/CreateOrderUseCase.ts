import { PrismaClient } from '@prisma/client';
import { ICartServiceClient } from '../../ports/interfaces/ICartServiceClient';
import { IProductServiceClient } from '../../ports/interfaces/IProductServiceClient';
import { IUserServiceClient } from '../../ports/interfaces/IUserServiceClient';
import { IEventPublisher, OrderCreatedEvent } from '../../ports/interfaces/IEventPublisher';
import { Order, OrderStatus, PaymentStatus } from '../../core/entities/Order';
import { OrderNumberGenerator } from '../services/OrderNumberGenerator';
import { createLogger } from '../../infrastructure/logging/logger';

const logger = createLogger();

export interface CreateOrderInput {
  userId: string;
  cartId?: string;
  shippingAddressId?: string;
  paymentMethodId?: string | null;
  shippingMethod?: string | null;
  token?: string;
}

export class CreateOrderUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cartServiceClient: ICartServiceClient,
    private readonly productServiceClient: IProductServiceClient,
    private readonly userServiceClient: IUserServiceClient,
    private readonly eventPublisher?: IEventPublisher
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    // 1. Get cart from Cart Service
    let cart;
    if (input.cartId) {
      cart = await this.cartServiceClient.getCart(input.cartId, input.token);
    } else {
      cart = await this.cartServiceClient.getCartByUserId(input.userId, input.token);
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error('Cart is empty or not found');
    }

    // 2. Validate all products and inventory
    for (const item of cart.items) {
      const isAvailable = await this.productServiceClient.validateProductAvailability(
        item.productId,
        item.variantId,
        item.quantity
      );

      if (!isAvailable) {
        throw new Error(`Product ${item.productId} is not available in the requested quantity`);
      }
    }

    // 3. Get shipping address from User Service
    let shippingAddress;
    if (input.shippingAddressId) {
      shippingAddress = await this.userServiceClient.getUserAddress(
        input.shippingAddressId,
        input.userId,
        input.token
      );
    } else {
      shippingAddress = await this.userServiceClient.getUserDefaultShippingAddress(
        input.userId,
        input.token
      );
    }

    if (!shippingAddress) {
      throw new Error('Shipping address is required');
    }

    // 4. Generate order number
    const orderNumber = OrderNumberGenerator.generateUnique();

    // 5. Prepare order items data (get product details for snapshots)
    const orderItemsData: Array<{
      productId: string;
      variantId: string | null;
      productName: string;
      productSku: string;
      productImageUrl: string | null;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
    }> = [];

    for (const cartItem of cart.items) {
      // Get product details for snapshot
      const product = await this.productServiceClient.getProduct(cartItem.productId);
      if (!product) {
        throw new Error(`Product ${cartItem.productId} not found`);
      }

      orderItemsData.push({
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        productName: product.name,
        productSku: product.sku,
        productImageUrl: product.imageUrl || null,
        unitPrice: cartItem.unitPrice,
        quantity: cartItem.quantity,
        totalPrice: cartItem.totalPrice,
      });
    }

    // 6. Create order atomically using Prisma transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: input.userId,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          subtotal: cart.subtotal,
          taxAmount: cart.taxAmount,
          shippingAmount: cart.shippingAmount,
          discountAmount: cart.discountAmount,
          totalAmount: cart.totalAmount,
          currency: cart.currency,
          paymentMethodId: input.paymentMethodId || null,
          shippingMethod: input.shippingMethod || null,
          trackingNumber: null,
          estimatedDeliveryDate: null,
          metadata: undefined,
        },
      });

      // Create order items
      await tx.orderItem.createMany({
        data: orderItemsData.map(item => ({
          orderId: createdOrder.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          productSku: item.productSku,
          productImageUrl: item.productImageUrl,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
        })),
      });

      // Create shipping address snapshot
      await tx.orderShippingAddress.create({
        data: {
          orderId: createdOrder.id,
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          company: shippingAddress.company,
          addressLine1: shippingAddress.addressLine1,
          addressLine2: shippingAddress.addressLine2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
          phone: shippingAddress.phone,
        },
      });

      // Create initial status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: createdOrder.id,
          status: OrderStatus.PENDING,
          previousStatus: null,
          changedBy: input.userId,
          reason: 'Order created',
        },
      });

      return Order.fromPrisma(createdOrder);
    });

    // 7. Reserve inventory (outside transaction - these are external service calls)
    for (const cartItem of cart.items) {
      try {
        await this.productServiceClient.reserveInventory(
          cartItem.productId,
          cartItem.variantId,
          cartItem.quantity
        );
      } catch (error) {
        logger.warn('Failed to reserve inventory', {
          productId: cartItem.productId,
          variantId: cartItem.variantId,
          quantity: cartItem.quantity,
          error,
        });
        // Continue - inventory reservation failure shouldn't fail order creation
        // In production, you might want to implement a compensation pattern here
      }
    }

    // 8. Mark cart as converted (optional - Cart Service may need this endpoint)
    if (cart.id) {
      try {
        await this.cartServiceClient.markCartAsConverted(cart.id, order.id, input.token);
      } catch (error) {
        logger.warn('Failed to mark cart as converted', { cartId: cart.id, orderId: order.id, error });
      }
    }

    // 9. Publish order.created event
    if (this.eventPublisher) {
      try {
        const event: OrderCreatedEvent = {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId: input.userId,
          totalAmount: order.totalAmount,
          currency: order.currency,
          itemCount: cart.items.length,
          timestamp: new Date().toISOString(),
          source: 'order-service',
        };
        await this.eventPublisher.publish('order.created', event);
      } catch (error) {
        logger.error('Failed to publish order.created event', {
          orderId: order.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Don't throw - event publishing is fire and forget
      }
    }

    logger.info('Order created successfully', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: input.userId,
      totalAmount: order.totalAmount,
    });

    return order;
  }
}

