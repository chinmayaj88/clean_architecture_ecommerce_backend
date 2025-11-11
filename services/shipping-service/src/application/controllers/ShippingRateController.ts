import { Response } from 'express';
import { RequestWithId } from '../../middleware/requestId.middleware';
import { CalculateShippingRateUseCase } from '../../core/use-cases/CalculateShippingRateUseCase';
import { sendSuccess, sendError } from '../utils/response.util';

export class ShippingRateController {
  constructor(
    private readonly calculateShippingRateUseCase: CalculateShippingRateUseCase
  ) {}

  async calculateRate(req: RequestWithId, res: Response): Promise<void> {
    try {
      const { countryCode, stateCode, postalCode, weight, orderAmount, itemCount } = req.body;

      if (!countryCode || !weight || orderAmount === undefined) {
        sendError(res, 'Missing required fields: countryCode, weight, orderAmount', 400);
        return;
      }

      const rates = await this.calculateShippingRateUseCase.execute({
        countryCode,
        stateCode,
        postalCode,
        weight: Number(weight),
        orderAmount: Number(orderAmount),
        itemCount: itemCount ? Number(itemCount) : undefined,
      });

      sendSuccess(res, 'Shipping rates calculated successfully', rates);
    } catch (error) {
      sendError(
        res,
        'Failed to calculate shipping rates',
        500,
        error instanceof Error ? [error.message] : undefined
      );
    }
  }
}

