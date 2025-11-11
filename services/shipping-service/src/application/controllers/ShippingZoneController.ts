import { Response } from 'express';
import { RequestWithId } from '../../middleware/requestId.middleware';
import { IShippingZoneRepository } from '../../ports/interfaces/IShippingZoneRepository';
import { sendSuccess, sendError, sendCreated } from '../utils/response.util';

export class ShippingZoneController {
  constructor(
    private readonly shippingZoneRepository: IShippingZoneRepository
  ) {}

  async getZones(req: RequestWithId, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const zones = await this.shippingZoneRepository.findAll(activeOnly);
      sendSuccess(res, 'Zones retrieved successfully', zones);
    } catch (error) {
      sendError(res, 'Failed to get zones', 500);
    }
  }

  async getZone(req: RequestWithId, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const zone = await this.shippingZoneRepository.findById(id);
      if (!zone) {
        sendError(res, 'Zone not found', 404);
        return;
      }
      sendSuccess(res, 'Zone retrieved successfully', zone);
    } catch (error) {
      sendError(res, 'Failed to get zone', 500);
    }
  }

  async createZone(req: RequestWithId, res: Response): Promise<void> {
    try {
      const zone = await this.shippingZoneRepository.create(req.body);
      sendCreated(res, 'Zone created successfully', zone);
    } catch (error) {
      sendError(res, 'Failed to create zone', 500);
    }
  }

  async updateZone(req: RequestWithId, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const zone = await this.shippingZoneRepository.update(id, req.body);
      sendSuccess(res, 'Zone updated successfully', zone);
    } catch (error) {
      sendError(res, 'Failed to update zone', 500);
    }
  }

  async deleteZone(req: RequestWithId, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.shippingZoneRepository.delete(id);
      sendSuccess(res, 'Zone deleted successfully');
    } catch (error) {
      sendError(res, 'Failed to delete zone', 500);
    }
  }
}

