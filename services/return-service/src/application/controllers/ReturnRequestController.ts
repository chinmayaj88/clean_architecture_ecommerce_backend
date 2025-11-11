import { Response } from 'express';
import { RequestWithId } from '../../middleware/requestId.middleware';
import { CreateReturnRequestUseCase } from '../../core/use-cases/CreateReturnRequestUseCase';
import { GetReturnRequestUseCase } from '../../core/use-cases/GetReturnRequestUseCase';
import { ApproveReturnRequestUseCase } from '../../core/use-cases/ApproveReturnRequestUseCase';
import { UpdateReturnStatusUseCase } from '../../core/use-cases/UpdateReturnStatusUseCase';
import { ProcessReturnRefundUseCase } from '../../core/use-cases/ProcessReturnRefundUseCase';
import { IReturnRequestRepository } from '../../ports/interfaces/IReturnRequestRepository';
import { sendSuccess, sendError, sendCreated } from '../utils/response.util';
import { ReturnStatus } from '../../core/entities/ReturnRequest';

export class ReturnRequestController {
  constructor(
    private readonly createReturnRequestUseCase: CreateReturnRequestUseCase,
    private readonly getReturnRequestUseCase: GetReturnRequestUseCase,
    private readonly approveReturnRequestUseCase: ApproveReturnRequestUseCase,
    private readonly updateReturnStatusUseCase: UpdateReturnStatusUseCase,
    private readonly processReturnRefundUseCase: ProcessReturnRefundUseCase,
    private readonly returnRequestRepository: IReturnRequestRepository
  ) {}

  async createReturnRequest(req: RequestWithId, res: Response): Promise<void> {
    try {
      const { orderId, returnReason, returnNotes, refundMethod, items } = req.body;
      const userId = (req as any).user?.id || req.body.userId;

      if (!orderId || !returnReason || !refundMethod || !items || !Array.isArray(items) || items.length === 0) {
        sendError(res, 'Missing required fields', 400);
        return;
      }

      if (!userId) {
        sendError(res, 'User ID is required', 401);
        return;
      }

      const returnRequest = await this.createReturnRequestUseCase.execute({
        orderId,
        userId,
        returnReason,
        returnNotes,
        refundMethod,
        items,
      });

      sendCreated(res, 'Return request created successfully', returnRequest);
    } catch (error) {
      sendError(
        res,
        error instanceof Error ? error.message : 'Failed to create return request',
        500,
        error instanceof Error ? [error.message] : undefined
      );
    }
  }

  async getReturnRequest(req: RequestWithId, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const returnRequest = await this.getReturnRequestUseCase.execute({
        returnRequestId: id,
        includeItems: true,
        includeAuthorization: true,
        includeHistory: true,
      });

      if (!returnRequest) {
        sendError(res, 'Return request not found', 404);
        return;
      }

      sendSuccess(res, 'Return request retrieved successfully', returnRequest);
    } catch (error) {
      sendError(
        res,
        'Failed to get return request',
        500,
        error instanceof Error ? [error.message] : undefined
      );
    }
  }

  async getReturnRequestsByUser(req: RequestWithId, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || req.query.userId as string;
      if (!userId) {
        sendError(res, 'User ID is required', 400);
        return;
      }

      const { status, limit, offset } = req.query;
      const requests = await this.returnRequestRepository.findByUserId(userId, {
        status: status as ReturnStatus | undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      sendSuccess(res, 'Return requests retrieved successfully', requests);
    } catch (error) {
      sendError(
        res,
        'Failed to get return requests',
        500,
        error instanceof Error ? [error.message] : undefined
      );
    }
  }

  async approveReturnRequest(req: RequestWithId, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { returnAddress, returnInstructions, expiresInDays } = req.body;
      const changedBy = (req as any).user?.id || 'system';

      if (!returnAddress) {
        sendError(res, 'Return address is required', 400);
        return;
      }

      const returnRequest = await this.approveReturnRequestUseCase.execute({
        returnRequestId: id,
        changedBy,
        returnAddress,
        returnInstructions,
        expiresInDays,
      });

      sendSuccess(res, 'Return request approved successfully', returnRequest);
    } catch (error) {
      sendError(
        res,
        error instanceof Error ? error.message : 'Failed to approve return request',
        500,
        error instanceof Error ? [error.message] : undefined
      );
    }
  }

  async updateReturnStatus(req: RequestWithId, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const changedBy = (req as any).user?.id || 'system';

      if (!status) {
        sendError(res, 'Status is required', 400);
        return;
      }

      const returnRequest = await this.updateReturnStatusUseCase.execute({
        returnRequestId: id,
        status: status as ReturnStatus,
        changedBy,
        notes,
      });

      sendSuccess(res, 'Return status updated successfully', returnRequest);
    } catch (error) {
      sendError(
        res,
        error instanceof Error ? error.message : 'Failed to update return status',
        500,
        error instanceof Error ? [error.message] : undefined
      );
    }
  }

  async processRefund(req: RequestWithId, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { paymentId } = req.body;
      const changedBy = (req as any).user?.id || 'system';

      const refund = await this.processReturnRefundUseCase.execute({
        returnRequestId: id,
        paymentId,
        changedBy,
      });

      sendSuccess(res, 'Refund processing initiated successfully', refund);
    } catch (error) {
      sendError(
        res,
        error instanceof Error ? error.message : 'Failed to process refund',
        500,
        error instanceof Error ? [error.message] : undefined
      );
    }
  }
}

