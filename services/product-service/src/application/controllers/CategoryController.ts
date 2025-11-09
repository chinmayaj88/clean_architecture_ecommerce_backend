import { Request, Response } from 'express';
import { CreateCategoryUseCase } from '../../core/use-cases/CreateCategoryUseCase';
import { GetCategoryUseCase } from '../../core/use-cases/GetCategoryUseCase';
import { ListCategoriesUseCase } from '../../core/use-cases/ListCategoriesUseCase';
import { UpdateCategoryUseCase } from '../../core/use-cases/UpdateCategoryUseCase';
import { DeleteCategoryUseCase } from '../../core/use-cases/DeleteCategoryUseCase';
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendNotFound,
} from '../utils/response.util';

export class CategoryController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly getCategoryUseCase: GetCategoryUseCase,
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const category = await this.createCategoryUseCase.execute(req.body);
      sendCreated(res, 'Category created successfully', category);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        sendBadRequest(res, error.message);
      } else if (error.message.includes('not found')) {
        sendNotFound(res, error.message);
      } else {
        sendBadRequest(res, error.message || 'Failed to create category');
      }
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const category = await this.getCategoryUseCase.execute(req.params.id);
      sendSuccess(res, 'Category retrieved successfully', category);
    } catch (error: any) {
      sendNotFound(res, error.message || 'Category not found');
    }
  }

  async getBySlug(req: Request, res: Response): Promise<void> {
    try {
      const category = await this.getCategoryUseCase.executeBySlug(req.params.slug);
      sendSuccess(res, 'Category retrieved successfully', category);
    } catch (error: any) {
      sendNotFound(res, error.message || 'Category not found');
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const filters: any = {};
      
      if (req.query.parentId) {
        filters.parentId = req.query.parentId === 'null' ? null : req.query.parentId;
      }
      
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }
      
      if (req.query.level !== undefined) {
        filters.level = parseInt(req.query.level as string, 10);
      }
      
      if (req.query.rootOnly === 'true') {
        filters.rootOnly = true;
      }

      const categories = await this.listCategoriesUseCase.execute(filters);
      sendSuccess(res, 'Categories retrieved successfully', { categories });
    } catch (error: any) {
      sendBadRequest(res, error.message || 'Failed to retrieve categories');
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const category = await this.updateCategoryUseCase.execute(req.params.id, req.body);
      sendSuccess(res, 'Category updated successfully', category);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendNotFound(res, error.message);
      } else {
        sendBadRequest(res, error.message || 'Failed to update category');
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await this.deleteCategoryUseCase.execute(req.params.id);
      sendSuccess(res, 'Category deleted successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendNotFound(res, error.message);
      } else {
        sendBadRequest(res, error.message || 'Failed to delete category');
      }
    }
  }
}

