import { Response } from 'express';
import { RequestWithId } from '../../middleware/requestId.middleware';
import { IShippingMethodRepository } from '../../ports/interfaces/IShippingMethodRepository';
import { sendSuccess, sendError, sendCreated } from '../utils/response.util';

export class ShippingMethodController {
  constructor(
    private readonly shippingMethodRepository: IShippingMethodRepository
  ) {}

  async getMethods(req: RequestWithId, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const zoneId = req.query.zoneId as string | undefined;
      
      let methods;
      if (zoneId) {
        methods = await this.shippingMethodRepository.findByZoneId(zoneId, activeOnly);
      } else {
        methods = await this.shippingMethodRepository.findAll(activeOnly);
      }
      
      sendSuccess(res, 'Methods retrieved successfully', methods);
    } catch (error) {
      sendError(res, 'Failed to get methods', 500);
    }
  }

  async getMethod(req: RequestWithId, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const method = await this.shippingMethodRepository.findById(id);
      if (!method) {
        sendError(res, 'Method not found', 404);
        return;
      }
      sendSuccess(res, 'Method retrieved successfully', method);
    } catch (error) {
      sendError(res, 'Failed to get method', 500);
    }
  }

  async createMethod(req: RequestWithId, res: Response): Promise<void> {
    try {
      const method = await this.shippingMethodRepository.create(req.body);
      sendCreated(res, 'Method created successfully', method);
    } catch (error) {
      sendError(res, 'Failed to create method', 500);
    }
  }

  async updateMethod(req: RequestWithId, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const method = await this.shippingMethodRepository.update(id, req.body);
      sendSuccess(res, 'Method updated successfully', method);
    } catch (error) {
      sendError(res, 'Failed to update method', 500);
    }
  }

  async deleteMethod(req: RequestWithId, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.shippingMethodRepository.delete(id);
      sendSuccess(res, 'Method deleted successfully');
    } catch (error) {
      sendError(res, 'Failed to delete method', 500);
    }
  }
}

