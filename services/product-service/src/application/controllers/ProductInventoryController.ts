import { Request, Response } from 'express';
import {
  CreateProductInventoryUseCase,
  GetProductInventoryUseCase,
  ReserveInventoryUseCase,
  ReleaseInventoryUseCase,
  AdjustInventoryUseCase,
} from '../../core/use-cases/ProductInventoryUseCases';
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendNotFound,
} from '../utils/response.util';

export class ProductInventoryController {
  constructor(
    private readonly createInventoryUseCase: CreateProductInventoryUseCase,
    private readonly getInventoryUseCase: GetProductInventoryUseCase,
    private readonly reserveInventoryUseCase: ReserveInventoryUseCase,
    private readonly releaseInventoryUseCase: ReleaseInventoryUseCase,
    private readonly adjustInventoryUseCase: AdjustInventoryUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const inventory = await this.createInventoryUseCase.execute({
        ...req.body,
        productId: req.params.productId,
      });
      sendCreated(res, 'Inventory created successfully', inventory);
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('already exists')) {
        sendBadRequest(res, error.message);
      } else {
        sendBadRequest(res, error.message || 'Failed to create inventory');
      }
    }
  }

  async get(req: Request, res: Response): Promise<void> {
    try {
      const inventory = await this.getInventoryUseCase.execute(
        req.params.productId,
        req.query.variantId as string | undefined
      );
      if (!inventory) {
        sendNotFound(res, 'Inventory not found');
        return;
      }
      sendSuccess(res, 'Inventory retrieved successfully', inventory);
    } catch (error: any) {
      sendBadRequest(res, error.message || 'Failed to retrieve inventory');
    }
  }

  async reserve(req: Request, res: Response): Promise<void> {
    try {
      const inventory = await this.reserveInventoryUseCase.execute(
        req.params.productId,
        req.query.variantId as string | null || null,
        parseInt(req.body.quantity, 10)
      );
      sendSuccess(res, 'Inventory reserved successfully', inventory);
    } catch (error: any) {
      sendBadRequest(res, error.message || 'Failed to reserve inventory');
    }
  }

  async release(req: Request, res: Response): Promise<void> {
    try {
      const inventory = await this.releaseInventoryUseCase.execute(
        req.params.productId,
        req.query.variantId as string | null || null,
        parseInt(req.body.quantity, 10)
      );
      sendSuccess(res, 'Inventory released successfully', inventory);
    } catch (error: any) {
      sendBadRequest(res, error.message || 'Failed to release inventory');
    }
  }

  async adjust(req: Request, res: Response): Promise<void> {
    try {
      const inventory = await this.adjustInventoryUseCase.execute(
        req.params.productId,
        req.query.variantId as string | null || null,
        parseInt(req.body.quantity, 10),
        req.body.reason
      );
      sendSuccess(res, 'Inventory adjusted successfully', inventory);
    } catch (error: any) {
      sendBadRequest(res, error.message || 'Failed to adjust inventory');
    }
  }
}

