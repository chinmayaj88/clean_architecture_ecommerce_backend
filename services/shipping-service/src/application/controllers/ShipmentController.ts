import { Response } from 'express';
import { RequestWithId } from '../../middleware/requestId.middleware';
import { CreateShipmentUseCase } from '../../core/use-cases/CreateShipmentUseCase';
import { GetShipmentTrackingUseCase } from '../../core/use-cases/GetShipmentTrackingUseCase';
import { UpdateShipmentStatusUseCase } from '../../core/use-cases/UpdateShipmentStatusUseCase';
import { IShipmentRepository } from '../../ports/interfaces/IShipmentRepository';
import { sendSuccess, sendError, sendCreated } from '../utils/response.util';

export class ShipmentController {
  constructor(
    private readonly createShipmentUseCase: CreateShipmentUseCase,
    private readonly getShipmentTrackingUseCase: GetShipmentTrackingUseCase,
    private readonly updateShipmentStatusUseCase: UpdateShipmentStatusUseCase,
    private readonly shipmentRepository: IShipmentRepository
  ) {}

  async createShipment(req: RequestWithId, res: Response): Promise<void> {
    try {
      const { orderId, methodId, weight, originAddress, destinationAddress, trackingNumber } = req.body;

      if (!orderId || !methodId || !weight || !originAddress || !destinationAddress) {
        sendError(res, 'Missing required fields', 400);
        return;
      }

      const shipment = await this.createShipmentUseCase.execute({
        orderId,
        methodId,
        weight: Number(weight),
        originAddress,
        destinationAddress,
        trackingNumber,
      });

      sendCreated(res, 'Shipment created successfully', shipment);
    } catch (error) {
      sendError(
        res,
        'Failed to create shipment',
        500,
        error instanceof Error ? [error.message] : undefined
      );
    }
  }

  async getShipment(req: RequestWithId, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const shipment = await this.shipmentRepository.findById(id);

      if (!shipment) {
        sendError(res, 'Shipment not found', 404);
        return;
      }

      sendSuccess(res, 'Shipment retrieved successfully', shipment);
    } catch (error) {
      sendError(
        res,
        'Failed to get shipment',
        500,
        error instanceof Error ? [error.message] : undefined
      );
    }
  }

  async getShipmentsByOrder(req: RequestWithId, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const shipments = await this.shipmentRepository.findByOrderId(orderId);

      sendSuccess(res, 'Shipments retrieved successfully', shipments);
    } catch (error) {
      sendError(
        res,
        'Failed to get shipments',
        500,
        error instanceof Error ? [error.message] : undefined
      );
    }
  }

  async getTracking(req: RequestWithId, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tracking = await this.getShipmentTrackingUseCase.executeByShipmentId(id);

      if (!tracking) {
        sendError(res, 'Shipment not found', 404);
        return;
      }

      sendSuccess(res, 'Tracking information retrieved successfully', tracking);
    } catch (error) {
      sendError(
        res,
        'Failed to get tracking information',
        500,
        error instanceof Error ? [error.message] : undefined
      );
    }
  }

  async trackByNumber(req: RequestWithId, res: Response): Promise<void> {
    try {
      const { trackingNumber } = req.params;
      const tracking = await this.getShipmentTrackingUseCase.executeByTrackingNumber(trackingNumber);

      if (!tracking) {
        sendError(res, 'Shipment not found', 404);
        return;
      }

      sendSuccess(res, 'Tracking information retrieved successfully', tracking);
    } catch (error) {
      sendError(
        res,
        'Failed to get tracking information',
        500,
        error instanceof Error ? [error.message] : undefined
      );
    }
  }

  async updateStatus(req: RequestWithId, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, location, description, carrierData } = req.body;

      if (!status) {
        sendError(res, 'Status is required', 400);
        return;
      }

      const shipment = await this.updateShipmentStatusUseCase.execute({
        shipmentId: id,
        status,
        location,
        description,
        carrierData,
      });

      sendSuccess(res, 'Shipment status updated successfully', shipment);
    } catch (error) {
      sendError(
        res,
        error instanceof Error ? error.message : 'Failed to update shipment status',
        500,
        error instanceof Error ? [error.message] : undefined
      );
    }
  }
}

