import { Request, Response } from 'express';
import {
  CreateProductVariantUseCase,
  GetProductVariantUseCase,
  UpdateProductVariantUseCase,
  DeleteProductVariantUseCase,
} from '../../core/use-cases/ProductVariantUseCases';
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendNotFound,
} from '../utils/response.util';

export class ProductVariantController {
  constructor(
    private readonly createVariantUseCase: CreateProductVariantUseCase,
    private readonly getVariantUseCase: GetProductVariantUseCase,
    private readonly updateVariantUseCase: UpdateProductVariantUseCase,
    private readonly deleteVariantUseCase: DeleteProductVariantUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const variant = await this.createVariantUseCase.execute({
        ...req.body,
        productId: req.params.productId,
      });
      sendCreated(res, 'Variant created successfully', variant);
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('already exists')) {
        sendBadRequest(res, error.message);
      } else {
        sendBadRequest(res, error.message || 'Failed to create variant');
      }
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const variant = await this.getVariantUseCase.execute(req.params.id);
      sendSuccess(res, 'Variant retrieved successfully', variant);
    } catch (error: any) {
      sendNotFound(res, error.message || 'Variant not found');
    }
  }

  async getByProductId(req: Request, res: Response): Promise<void> {
    try {
      const variants = await this.getVariantUseCase.executeByProductId(req.params.productId);
      sendSuccess(res, 'Variants retrieved successfully', { variants });
    } catch (error: any) {
      sendBadRequest(res, error.message || 'Failed to retrieve variants');
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const variant = await this.updateVariantUseCase.execute(req.params.id, req.body);
      sendSuccess(res, 'Variant updated successfully', variant);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendNotFound(res, error.message);
      } else {
        sendBadRequest(res, error.message || 'Failed to update variant');
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await this.deleteVariantUseCase.execute(req.params.id);
      sendSuccess(res, 'Variant deleted successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendNotFound(res, error.message);
      } else {
        sendBadRequest(res, error.message || 'Failed to delete variant');
      }
    }
  }
}

