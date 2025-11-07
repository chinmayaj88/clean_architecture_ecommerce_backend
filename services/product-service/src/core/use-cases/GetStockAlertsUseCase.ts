/**
 * Get Stock Alerts Use Case
 */

import { IStockAlertRepository } from '../../ports/interfaces/IStockAlertRepository';
import { StockAlert } from '../../core/entities/StockAlert';

export class GetStockAlertsUseCase {
  constructor(private readonly stockAlertRepository: IStockAlertRepository) {}

  async execute(userId: string): Promise<StockAlert[]> {
    return this.stockAlertRepository.findByUserId(userId);
  }
}

