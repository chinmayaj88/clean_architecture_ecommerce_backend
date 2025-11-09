import { Request, Response } from 'express';
import {
  CreateProductImageUseCase,
  GetProductImageUseCase,
  UpdateProductImageUseCase,
  DeleteProductImageUseCase,
  SetPrimaryImageUseCase,
} from '../../core/use-cases/ProductImageUseCases';
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendNotFound,
} from '../utils/response.util';

export class ProductImageController {
  constructor(
    private readonly createImageUseCase: CreateProductImageUseCase,
    private readonly getImageUseCase: GetProductImageUseCase,
    private readonly updateImageUseCase: UpdateProductImageUseCase,
    private readonly deleteImageUseCase: DeleteProductImageUseCase,
    private readonly setPrimaryImageUseCase: SetPrimaryImageUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const image = await this.createImageUseCase.execute({
        ...req.body,
        productId: req.params.productId,
      });
      sendCreated(res, 'Image created successfully', image);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendBadRequest(res, error.message);
      } else {
        sendBadRequest(res, error.message || 'Failed to create image');
      }
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const image = await this.getImageUseCase.execute(req.params.id);
      sendSuccess(res, 'Image retrieved successfully', image);
    } catch (error: any) {
      sendNotFound(res, error.message || 'Image not found');
    }
  }

  async getByProductId(req: Request, res: Response): Promise<void> {
    try {
      const images = await this.getImageUseCase.executeByProductId(req.params.productId);
      sendSuccess(res, 'Images retrieved successfully', { images });
    } catch (error: any) {
      sendBadRequest(res, error.message || 'Failed to retrieve images');
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const image = await this.updateImageUseCase.execute(req.params.id, req.body);
      sendSuccess(res, 'Image updated successfully', image);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendNotFound(res, error.message);
      } else {
        sendBadRequest(res, error.message || 'Failed to update image');
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await this.deleteImageUseCase.execute(req.params.id);
      sendSuccess(res, 'Image deleted successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendNotFound(res, error.message);
      } else {
        sendBadRequest(res, error.message || 'Failed to delete image');
      }
    }
  }

  async setPrimary(req: Request, res: Response): Promise<void> {
    try {
      await this.setPrimaryImageUseCase.execute(req.params.id, req.params.productId);
      sendSuccess(res, 'Primary image set successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendNotFound(res, error.message);
      } else {
        sendBadRequest(res, error.message || 'Failed to set primary image');
      }
    }
  }
}

