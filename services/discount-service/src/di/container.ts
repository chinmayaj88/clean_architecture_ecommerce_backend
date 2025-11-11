import { PrismaClient } from '@prisma/client';
import { getEnvConfig } from '../config/env';
import { createLogger } from '../infrastructure/logging/logger';

// Repositories
import { PrismaCouponRepository } from '../infrastructure/database/PrismaCouponRepository';
import { PrismaCouponUsageRepository } from '../infrastructure/database/PrismaCouponUsageRepository';
import { PrismaPromotionRepository } from '../infrastructure/database/PrismaPromotionRepository';
import { PrismaPromotionRuleRepository } from '../infrastructure/database/PrismaPromotionRuleRepository';
import { PrismaPromotionUsageRepository } from '../infrastructure/database/PrismaPromotionUsageRepository';

// Use Cases
import { ValidateCouponUseCase } from '../core/use-cases/ValidateCouponUseCase';
import { CalculateDiscountUseCase } from '../core/use-cases/CalculateDiscountUseCase';
import { ApplyCouponUseCase } from '../core/use-cases/ApplyCouponUseCase';
import { EvaluatePromotionUseCase } from '../core/use-cases/EvaluatePromotionUseCase';
import { ApplyPromotionUseCase } from '../core/use-cases/ApplyPromotionUseCase';

// Controllers
import { CouponController } from '../application/controllers/CouponController';
import { PromotionController } from '../application/controllers/PromotionController';
import { DiscountController } from '../application/controllers/DiscountController';

// Event Consumer
import { SQSEventConsumer } from '../infrastructure/events/SQSEventConsumer';
import { DiscountEventHandlers } from '../infrastructure/events/DiscountEventHandlers';
import { IEventConsumer } from '../ports/interfaces/IEventConsumer';

// Clients
import { CartServiceClient, ICartServiceClient } from '../infrastructure/clients/CartServiceClient';
import { OrderServiceClient, IOrderServiceClient } from '../infrastructure/clients/OrderServiceClient';
import { ProductServiceClient, IProductServiceClient } from '../infrastructure/clients/ProductServiceClient';

// Interfaces
import { ICouponRepository } from '../ports/interfaces/ICouponRepository';
import { ICouponUsageRepository } from '../ports/interfaces/ICouponUsageRepository';
import { IPromotionRepository } from '../ports/interfaces/IPromotionRepository';
import { IPromotionRuleRepository } from '../ports/interfaces/IPromotionRuleRepository';
import { IPromotionUsageRepository } from '../ports/interfaces/IPromotionUsageRepository';

const logger = createLogger();
const config = getEnvConfig();

export class Container {
  private static instance: Container;
  private prisma: PrismaClient;
  private couponRepository: ICouponRepository;
  private couponUsageRepository: ICouponUsageRepository;
  private promotionRepository: IPromotionRepository;
  private promotionRuleRepository: IPromotionRuleRepository;
  private promotionUsageRepository: IPromotionUsageRepository;
  private validateCouponUseCase: ValidateCouponUseCase;
  private calculateDiscountUseCase: CalculateDiscountUseCase;
  private applyCouponUseCase: ApplyCouponUseCase;
  private evaluatePromotionUseCase: EvaluatePromotionUseCase;
  private applyPromotionUseCase: ApplyPromotionUseCase;
  private couponController: CouponController;
  private promotionController: PromotionController;
  private discountController: DiscountController;
  private eventConsumer: IEventConsumer;
  private eventHandlers: DiscountEventHandlers;
  private cartServiceClient: ICartServiceClient;
  private orderServiceClient: IOrderServiceClient;
  private productServiceClient: IProductServiceClient;

  private constructor() {
    // Initialize Prisma
    this.prisma = new PrismaClient({
      log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Initialize repositories
    this.couponRepository = new PrismaCouponRepository(this.prisma);
    this.couponUsageRepository = new PrismaCouponUsageRepository(this.prisma);
    this.promotionRepository = new PrismaPromotionRepository(this.prisma);
    this.promotionRuleRepository = new PrismaPromotionRuleRepository(this.prisma);
    this.promotionUsageRepository = new PrismaPromotionUsageRepository(this.prisma);

    // Initialize clients
    this.cartServiceClient = new CartServiceClient();
    this.orderServiceClient = new OrderServiceClient();
    this.productServiceClient = new ProductServiceClient();

    // Initialize use cases
    this.validateCouponUseCase = new ValidateCouponUseCase(
      this.couponRepository,
      this.couponUsageRepository
    );
    this.calculateDiscountUseCase = new CalculateDiscountUseCase();
    this.applyCouponUseCase = new ApplyCouponUseCase(
      this.couponRepository,
      this.couponUsageRepository,
      this.validateCouponUseCase,
      this.calculateDiscountUseCase
    );
    this.evaluatePromotionUseCase = new EvaluatePromotionUseCase(
      this.promotionRepository,
      this.promotionRuleRepository
    );
    this.applyPromotionUseCase = new ApplyPromotionUseCase(
      this.promotionRepository,
      this.promotionUsageRepository,
      this.evaluatePromotionUseCase
    );

    // Initialize controllers
    this.couponController = new CouponController(this.couponRepository);
    this.promotionController = new PromotionController(
      this.promotionRepository,
      this.promotionRuleRepository
    );
    this.discountController = new DiscountController(
      this.validateCouponUseCase,
      this.calculateDiscountUseCase,
      this.applyCouponUseCase,
      this.evaluatePromotionUseCase,
      this.applyPromotionUseCase,
      this.cartServiceClient,
      this.promotionRepository
    );

    // Initialize event handlers
    this.eventHandlers = new DiscountEventHandlers(
      this.applyCouponUseCase,
      this.applyPromotionUseCase,
      this.couponUsageRepository,
      this.promotionUsageRepository,
      this.orderServiceClient
    );

    // Initialize event consumer
    this.eventConsumer = new SQSEventConsumer();
    this.setupEventHandlers();

    logger.info('Container initialized');
  }

  private setupEventHandlers(): void {
    // Register event handlers
    this.eventConsumer.subscribe('order.created', (event) =>
      this.eventHandlers.handleOrderCreated(event as any)
    );
    this.eventConsumer.subscribe('order.cancelled', (event) =>
      this.eventHandlers.handleOrderCancelled(event as any)
    );
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  // Getters
  getPrisma(): PrismaClient {
    return this.prisma;
  }

  getCouponController(): CouponController {
    return this.couponController;
  }

  getPromotionController(): PromotionController {
    return this.promotionController;
  }

  getDiscountController(): DiscountController {
    return this.discountController;
  }

  getEventConsumer(): IEventConsumer {
    return this.eventConsumer;
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    await this.eventConsumer.stop();
    logger.info('Container disconnected');
  }
}

