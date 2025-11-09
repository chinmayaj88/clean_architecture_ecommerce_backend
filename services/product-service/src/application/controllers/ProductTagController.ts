import { Request, Response } from 'express';
import {
  CreateProductTagUseCase,
  GetProductTagUseCase,
  DeleteProductTagUseCase,
} from '../../core/use-cases/ProductTagUseCases';
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendNotFound,
} from '../utils/response.util';

export class ProductTagController {
  constructor(
    private readonly createTagUseCase: CreateProductTagUseCase,
    private readonly getTagUseCase: GetProductTagUseCase,
    private readonly deleteTagUseCase: DeleteProductTagUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const tag = await this.createTagUseCase.execute({
        ...req.body,
        productId: req.params.productId,
      });
      sendCreated(res, 'Tag created successfully', tag);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendBadRequest(res, error.message);
      } else {
        sendBadRequest(res, error.message || 'Failed to create tag');
      }
    }
  }

  async getByProductId(req: Request, res: Response): Promise<void> {
    try {
      const tags = await this.getTagUseCase.executeByProductId(req.params.productId);
      sendSuccess(res, 'Tags retrieved successfully', { tags });
    } catch (error: any) {
      sendBadRequest(res, error.message || 'Failed to retrieve tags');
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await this.deleteTagUseCase.execute(req.params.id);
      sendSuccess(res, 'Tag deleted successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendNotFound(res, error.message);
      } else {
        sendBadRequest(res, error.message || 'Failed to delete tag');
      }
    }
  }

  async deleteByTag(req: Request, res: Response): Promise<void> {
    try {
      await this.deleteTagUseCase.executeByProductIdAndTag(
        req.params.productId,
        req.params.tag
      );
      sendSuccess(res, 'Tag deleted successfully');
    } catch (error: any) {
      sendBadRequest(res, error.message || 'Failed to delete tag');
    }
  }
}

