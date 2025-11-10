import { getEnvConfig } from '../../config/env';

const config = getEnvConfig();

export class OrderNumberGenerator {
  private static sequence = 0;
  private static lastDate = '';

  static generate(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    // Reset sequence if date changed
    if (this.lastDate !== dateStr) {
      this.sequence = 0;
      this.lastDate = dateStr;
    }

    // Increment sequence
    this.sequence++;

    // Format: ORD-YYYYMMDD-NNNNNN (e.g., ORD-20241109-000001)
    const sequenceStr = String(this.sequence).padStart(6, '0');
    const prefix = config.ORDER_NUMBER_PREFIX || 'ORD';

    return `${prefix}-${year}${month}${day}-${sequenceStr}`;
  }

  static generateUnique(): string {
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    const base = this.generate();
    return `${base}-${timestamp}`;
  }
}

