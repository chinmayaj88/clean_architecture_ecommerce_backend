import { PrismaClient } from '@prisma/client';
import { getEnvConfig } from '../config/env';

// Repositories
import { PrismaReturnRequestRepository } from '../infrastructure/database/PrismaReturnRequestRepository';
import { PrismaReturnItemRepository } from '../infrastructure/database/PrismaReturnItemRepository';
import { PrismaReturnAuthorizationRepository } from '../infrastructure/database/PrismaReturnAuthorizationRepository';
import { PrismaReturnStatusHistoryRepository } from '../infrastructure/database/PrismaReturnStatusHistoryRepository';
import { PrismaReturnTrackingRepository } from '../infrastructure/database/PrismaReturnTrackingRepository';
import { PrismaRefundRepository } from '../infrastructure/database/PrismaRefundRepository';

// Use Cases
import { CreateReturnRequestUseCase } from '../core/use-cases/CreateReturnRequestUseCase';
import { GetReturnRequestUseCase } from '../core/use-cases/GetReturnRequestUseCase';
import { ApproveReturnRequestUseCase } from '../core/use-cases/ApproveReturnRequestUseCase';
import { UpdateReturnStatusUseCase } from '../core/use-cases/UpdateReturnStatusUseCase';
import { ProcessReturnRefundUseCase } from '../core/use-cases/ProcessReturnRefundUseCase';

// Controllers
import { ReturnRequestController } from '../application/controllers/ReturnRequestController';

// Interfaces
import { IReturnRequestRepository } from '../ports/interfaces/IReturnRequestRepository';
import { IReturnItemRepository } from '../ports/interfaces/IReturnItemRepository';
import { IReturnAuthorizationRepository } from '../ports/interfaces/IReturnAuthorizationRepository';
import { IReturnStatusHistoryRepository } from '../ports/interfaces/IReturnStatusHistoryRepository';
import { IReturnTrackingRepository } from '../ports/interfaces/IReturnTrackingRepository';
import { IRefundRepository } from '../ports/interfaces/IRefundRepository';

// Clients
import { OrderServiceClient, IOrderServiceClient } from '../infrastructure/clients/OrderServiceClient';
import { PaymentServiceClient, IPaymentServiceClient } from '../infrastructure/clients/PaymentServiceClient';

// Events
import { SQSEventConsumer } from '../infrastructure/events/SQSEventConsumer';
import { ReturnEventHandlers } from '../infrastructure/events/ReturnEventHandlers';
import { IEventConsumer } from '../ports/interfaces/IEventConsumer';
import { createLogger } from '../infrastructure/logging/logger';

const config = getEnvConfig();
const logger = createLogger();

export class Container {
  private static instance: Container;
  private prisma: PrismaClient;
  private returnRequestRepository: IReturnRequestRepository;
  private returnItemRepository: IReturnItemRepository;
  private authorizationRepository: IReturnAuthorizationRepository;
  private statusHistoryRepository: IReturnStatusHistoryRepository;
  private trackingRepository: IReturnTrackingRepository;
  private refundRepository: IRefundRepository;
  private createReturnRequestUseCase: CreateReturnRequestUseCase;
  private getReturnRequestUseCase: GetReturnRequestUseCase;
  private approveReturnRequestUseCase: ApproveReturnRequestUseCase;
  private updateReturnStatusUseCase: UpdateReturnStatusUseCase;
  private processReturnRefundUseCase: ProcessReturnRefundUseCase;
  private returnRequestController: ReturnRequestController;
  private orderServiceClient: IOrderServiceClient;
  private paymentServiceClient: IPaymentServiceClient;
  private eventConsumer: IEventConsumer;
  private eventHandlers: ReturnEventHandlers;

  private constructor() {
    // Initialize Prisma
    this.prisma = new PrismaClient({
      log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Initialize repositories
    this.returnRequestRepository = new PrismaReturnRequestRepository(this.prisma);
    this.returnItemRepository = new PrismaReturnItemRepository(this.prisma);
    this.authorizationRepository = new PrismaReturnAuthorizationRepository(this.prisma);
    this.statusHistoryRepository = new PrismaReturnStatusHistoryRepository(this.prisma);
    this.trackingRepository = new PrismaReturnTrackingRepository(this.prisma);
    this.refundRepository = new PrismaRefundRepository(this.prisma);

    // Initialize service clients
    this.orderServiceClient = new OrderServiceClient();
    this.paymentServiceClient = new PaymentServiceClient();

    // Initialize use cases
    this.createReturnRequestUseCase = new CreateReturnRequestUseCase(
      this.returnRequestRepository,
      this.returnItemRepository,
      this.statusHistoryRepository
    );

    this.getReturnRequestUseCase = new GetReturnRequestUseCase(
      this.returnRequestRepository,
      this.returnItemRepository,
      this.authorizationRepository,
      this.statusHistoryRepository
    );

    this.approveReturnRequestUseCase = new ApproveReturnRequestUseCase(
      this.returnRequestRepository,
      this.authorizationRepository,
      this.statusHistoryRepository
    );

    this.updateReturnStatusUseCase = new UpdateReturnStatusUseCase(
      this.returnRequestRepository,
      this.statusHistoryRepository
    );

    this.processReturnRefundUseCase = new ProcessReturnRefundUseCase(
      this.returnRequestRepository,
      this.refundRepository,
      this.statusHistoryRepository
    );

    // Initialize event handlers
    this.eventHandlers = new ReturnEventHandlers(
      this.updateReturnStatusUseCase,
      this.returnRequestRepository
    );

    // Initialize event consumer
    this.eventConsumer = new SQSEventConsumer();
    this.setupEventHandlers();

    // Initialize controllers
    this.returnRequestController = new ReturnRequestController(
      this.createReturnRequestUseCase,
      this.getReturnRequestUseCase,
      this.approveReturnRequestUseCase,
      this.updateReturnStatusUseCase,
      this.processReturnRefundUseCase,
      this.returnRequestRepository
    );

    logger.info('Container initialized');
  }

  private setupEventHandlers(): void {
    this.eventConsumer.subscribe('order.delivered', (event) =>
      this.eventHandlers.handleOrderDelivered(event as any)
    );
    this.eventConsumer.subscribe('order.cancelled', (event) =>
      this.eventHandlers.handleOrderCancelled(event as any)
    );
    this.eventConsumer.subscribe('refund.completed', (event) =>
      this.eventHandlers.handleRefundCompleted(event as any)
    );
    this.eventConsumer.subscribe('refund.failed', (event) =>
      this.eventHandlers.handleRefundFailed(event as any)
    );
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  public getPrisma(): PrismaClient {
    return this.prisma;
  }

  public getReturnRequestController(): ReturnRequestController {
    return this.returnRequestController;
  }

  public getEventConsumer(): IEventConsumer {
    return this.eventConsumer;
  }

  public async disconnect(): Promise<void> {
    await this.eventConsumer.stop();
    await this.prisma.$disconnect();
  }
}

