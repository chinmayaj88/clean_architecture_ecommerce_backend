import { Response } from 'express';
import { CreateOrderUseCase } from '../../core/use-cases/CreateOrderUseCase';
import { GetOrderUseCase } from '../../core/use-cases/GetOrderUseCase';
import { UpdateOrderStatusUseCase } from '../../core/use-cases/UpdateOrderStatusUseCase';
import { CancelOrderUseCase } from '../../core/use-cases/CancelOrderUseCase';
import {
  CreateOrderNoteUseCase,
  GetOrderNotesUseCase,
  UpdateOrderNoteUseCase,
  DeleteOrderNoteUseCase,
} from '../../core/use-cases/OrderNoteUseCases';
import { RequestWithId } from '../../middleware/requestId.middleware';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/errorHandler.middleware';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.util';
import { OrderStatus, PaymentStatus } from '../../core/entities/Order';

export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    private readonly createOrderNoteUseCase: CreateOrderNoteUseCase,
    private readonly getOrderNotesUseCase: GetOrderNotesUseCase,
    private readonly updateOrderNoteUseCase: UpdateOrderNoteUseCase,
    private readonly deleteOrderNoteUseCase: DeleteOrderNoteUseCase
  ) {}

  async createOrder(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const token = req.headers.authorization?.replace('Bearer ', '');

      const order = await this.createOrderUseCase.execute({
        userId,
        cartId: req.body.cartId,
        shippingAddressId: req.body.shippingAddressId,
        paymentMethodId: req.body.paymentMethodId || null,
        shippingMethod: req.body.shippingMethod || null,
        token,
      });

      sendCreated(res, 'Order created successfully', order);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to create order');
    }
  }

  async getOrder(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const orderId = req.params.orderId;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const result = await this.getOrderUseCase.execute(orderId, userId);

      if (!result) {
        throw new AppError(404, 'Order not found');
      }

      sendSuccess(res, 'Order retrieved successfully', result);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error && error.message === 'Unauthorized to view this order') {
        throw new AppError(403, error.message);
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to get order');
    }
  }

  async getOrderByOrderNumber(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const orderNumber = req.params.orderNumber;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const result = await this.getOrderUseCase.executeByOrderNumber(orderNumber, userId);

      if (!result) {
        throw new AppError(404, 'Order not found');
      }

      sendSuccess(res, 'Order retrieved successfully', result);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error && error.message === 'Unauthorized to view this order') {
        throw new AppError(403, error.message);
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to get order');
    }
  }

  async getOrdersByUserId(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      // Check if pagination is requested
      const usePagination = req.query.limit !== undefined || req.query.offset !== undefined;

      if (usePagination) {
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
        const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
        const status = req.query.status as OrderStatus | undefined;
        const paymentStatus = req.query.paymentStatus as PaymentStatus | undefined;
        const sortBy = (req.query.sortBy as 'createdAt' | 'totalAmount' | 'status') || 'createdAt';
        const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        const minAmount = req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined;
        const maxAmount = req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined;

        const result = await this.getOrderUseCase.executeByUserIdPaginated(userId, {
          status,
          paymentStatus,
          limit,
          offset,
          sortBy,
          sortOrder,
          startDate,
          endDate,
          minAmount,
          maxAmount,
        });

        sendSuccess(res, 'Orders retrieved successfully', result);
      } else {
        // Backward compatibility: return all orders if no pagination
        const status = req.query.status as string | undefined;
        const orders = await this.getOrderUseCase.executeByUserId(userId, status as any);
        sendSuccess(res, 'Orders retrieved successfully', orders);
      }
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to get orders');
    }
  }

  async updateOrderStatus(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const orderId = req.params.orderId;
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const order = await this.updateOrderStatusUseCase.execute({
        orderId,
        status: req.body.status,
        changedBy: userId,
        reason: req.body.reason || null,
      });

      sendSuccess(res, 'Order status updated successfully', order);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to update order status');
    }
  }

  async updatePaymentStatus(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const orderId = req.params.orderId;
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const order = await this.updateOrderStatusUseCase.updatePaymentStatus({
        orderId,
        paymentStatus: req.body.paymentStatus,
        changedBy: userId,
        reason: req.body.reason || null,
      });

      sendSuccess(res, 'Payment status updated successfully', order);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to update payment status');
    }
  }

  async cancelOrder(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const orderId = req.params.orderId;
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const order = await this.cancelOrderUseCase.execute({
        orderId,
        cancelledBy: userId,
        reason: req.body.reason || null,
      });

      sendSuccess(res, 'Order cancelled successfully', order);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to cancel order');
    }
  }

  async createOrderNote(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const orderId = req.params.orderId;
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const note = await this.createOrderNoteUseCase.execute({
        orderId,
        note: req.body.note,
        createdBy: userId,
        isInternal: req.body.isInternal || false,
      });

      sendCreated(res, 'Order note created successfully', note);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to create order note');
    }
  }

  async getOrderNotes(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const orderId = req.params.orderId;
      const includeInternal = req.query.includeInternal === 'true';

      const notes = await this.getOrderNotesUseCase.execute(orderId, includeInternal);

      sendSuccess(res, 'Order notes retrieved successfully', notes);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to get order notes');
    }
  }

  async updateOrderNote(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const noteId = req.params.noteId;
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const note = await this.updateOrderNoteUseCase.execute({
        noteId,
        note: req.body.note,
        updatedBy: userId,
      });

      sendSuccess(res, 'Order note updated successfully', note);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to update order note');
    }
  }

  async deleteOrderNote(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const noteId = req.params.noteId;

      await this.deleteOrderNoteUseCase.execute(noteId);

      sendNoContent(res);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to delete order note');
    }
  }
}

