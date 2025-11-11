export enum PromotionType {
  BUY_X_GET_Y = 'BUY_X_GET_Y',
  BUNDLE = 'BUNDLE',
  VOLUME_DISCOUNT = 'VOLUME_DISCOUNT',
}

export enum PromotionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED',
}

export class Promotion {
  constructor(
    public id: string,
    public name: string,
    public description: string | null,
    public type: PromotionType,
    public status: PromotionStatus,
    public startsAt: Date | null,
    public endsAt: Date | null,
    public isActive: boolean,
    public configuration: Record<string, any>,
    public metadata: Record<string, any> | null,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(data: any): Promotion {
    return new Promotion(
      data.id,
      data.name,
      data.description,
      data.type as PromotionType,
      data.status as PromotionStatus,
      data.startsAt,
      data.endsAt,
      data.isActive,
      data.configuration as Record<string, any>,
      data.metadata as Record<string, any> | null,
      data.createdAt,
      data.updatedAt
    );
  }

  /**
   * Check if promotion is currently valid
   */
  isValid(): boolean {
    if (!this.isActive || this.status !== PromotionStatus.ACTIVE) {
      return false;
    }

    const now = new Date();
    if (this.startsAt && now < this.startsAt) {
      return false;
    }
    if (this.endsAt && now > this.endsAt) {
      return false;
    }

    return true;
  }
}

