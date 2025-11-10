import { PrismaClient } from '@prisma/client';
import { IPaymentRepository } from '../ports/interfaces/IPaymentRepository';
import { IPaymentTransactionRepository } from '../ports/interfaces/IPaymentTransactionRepository';
import { IRefundRepository } from '../ports/interfaces/IRefundRepository';
import { IPaymentMethodRepository } from '../ports/interfaces/IPaymentMethodRepository';
import { IPaymentWebhookRepository } from '../ports/interfaces/IPaymentWebhookRepository';
import { IOrderServiceClient } from '../ports/interfaces/IOrderServiceClient';
import { IEventPublisher } from '../ports/interfaces/IEventPublisher';
import { IEventConsumer } from '../ports/interfaces/IEventConsumer';
import { PrismaPaymentRepository } from '../infrastructure/database/PrismaPaymentRepository';
import { PrismaPaymentTransactionRepository } from '../infrastructure/database/PrismaPaymentTransactionRepository';
import { PrismaRefundRepository } from '../infrastructure/database/PrismaRefundRepository';
import { PrismaPaymentMethodRepository } from '../infrastructure/database/PrismaPaymentMethodRepository';
import { PrismaPaymentWebhookRepository } from '../infrastructure/database/PrismaPaymentWebhookRepository';
import { OrderServiceClient } from '../infrastructure/clients/OrderServiceClient';
import { createEventPublisher } from '../infrastructure/events/EventPublisherFactory';
import { createEventConsumer } from '../infrastructure/events/EventConsumerFactory';
import { CreatePaymentUseCase } from '../core/use-cases/CreatePaymentUseCase';
import { ProcessPaymentUseCase } from '../core/use-cases/ProcessPaymentUseCase';
import { RefundPaymentUseCase } from '../core/use-cases/RefundPaymentUseCase';
import { GetPaymentUseCase } from '../core/use-cases/GetPaymentUseCase';
import { CreatePaymentMethodUseCase } from '../core/use-cases/CreatePaymentMethodUseCase';
import { GetPaymentMethodsUseCase } from '../core/use-cases/GetPaymentMethodsUseCase';
import { ProcessWebhookUseCase } from '../core/use-cases/ProcessWebhookUseCase';
import { HandleOrderCreatedEventUseCase } from '../core/use-cases/HandleOrderCreatedEventUseCase';
import { HandleOrderCancelledEventUseCase } from '../core/use-cases/HandleOrderCancelledEventUseCase';
import { PaymentController } from '../application/controllers/PaymentController';
import { createLogger } from '../infrastructure/logging/logger';

const logger = createLogger();

export class Container {
  private static instance: Container;
  private prisma: PrismaClient;
  private paymentRepository: IPaymentRepository;
  private paymentTransactionRepository: IPaymentTransactionRepository;
  private refundRepository: IRefundRepository;
  private paymentMethodRepository: IPaymentMethodRepository;
  private paymentWebhookRepository: IPaymentWebhookRepository;
  private orderServiceClient: IOrderServiceClient;
  private eventPublisher: IEventPublisher;
  private eventConsumer: IEventConsumer;
  private createPaymentUseCase: CreatePaymentUseCase;
  private processPaymentUseCase: ProcessPaymentUseCase;
  private refundPaymentUseCase: RefundPaymentUseCase;
  private getPaymentUseCase: GetPaymentUseCase;
  private createPaymentMethodUseCase: CreatePaymentMethodUseCase;
  private getPaymentMethodsUseCase: GetPaymentMethodsUseCase;
  private processWebhookUseCase: ProcessWebhookUseCase;
  private handleOrderCreatedEventUseCase: HandleOrderCreatedEventUseCase;
  private handleOrderCancelledEventUseCase: HandleOrderCancelledEventUseCase;
  private paymentController: PaymentController;

  private constructor() {
    // Initialize Prisma
    this.prisma = new PrismaClient();

    // Initialize repositories
    this.paymentRepository = new PrismaPaymentRepository(this.prisma);
    this.paymentTransactionRepository = new PrismaPaymentTransactionRepository(this.prisma);
    this.refundRepository = new PrismaRefundRepository(this.prisma);
    this.paymentMethodRepository = new PrismaPaymentMethodRepository(this.prisma);
    this.paymentWebhookRepository = new PrismaPaymentWebhookRepository(this.prisma);

    // Initialize external clients
    this.orderServiceClient = new OrderServiceClient();
    this.eventPublisher = createEventPublisher();
    this.eventConsumer = createEventConsumer();

    // Initialize use cases
    this.createPaymentUseCase = new CreatePaymentUseCase(
      this.prisma,
      this.paymentRepository,
      this.paymentTransactionRepository,
      this.orderServiceClient
    );
    this.processPaymentUseCase = new ProcessPaymentUseCase(
      this.prisma,
      this.paymentRepository,
      this.paymentTransactionRepository,
      this.orderServiceClient,
      this.eventPublisher
    );
    this.refundPaymentUseCase = new RefundPaymentUseCase(
      this.prisma,
      this.paymentRepository,
      this.paymentTransactionRepository,
      this.refundRepository,
      this.orderServiceClient,
      this.eventPublisher
    );
    this.getPaymentUseCase = new GetPaymentUseCase(
      this.paymentRepository,
      this.paymentTransactionRepository,
      this.refundRepository
    );
    this.createPaymentMethodUseCase = new CreatePaymentMethodUseCase(this.paymentMethodRepository);
    this.getPaymentMethodsUseCase = new GetPaymentMethodsUseCase(this.paymentMethodRepository);
    this.processWebhookUseCase = new ProcessWebhookUseCase(
      this.prisma,
      this.paymentWebhookRepository,
      this.paymentRepository,
      this.paymentTransactionRepository,
      this.orderServiceClient,
      this.eventPublisher
    );
    this.handleOrderCreatedEventUseCase = new HandleOrderCreatedEventUseCase(
      this.createPaymentUseCase,
      this.processPaymentUseCase
    );
    this.handleOrderCancelledEventUseCase = new HandleOrderCancelledEventUseCase(
      this.paymentRepository
    );

    // Register event handlers
    this.eventConsumer.onOrderCreated(async (event) => {
      await this.handleOrderCreatedEventUseCase.execute(event);
    });
    this.eventConsumer.onOrderCancelled(async (event) => {
      await this.handleOrderCancelledEventUseCase.execute(event);
    });

    // Initialize controller
    this.paymentController = new PaymentController(
      this.createPaymentUseCase,
      this.processPaymentUseCase,
      this.refundPaymentUseCase,
      this.getPaymentUseCase,
      this.createPaymentMethodUseCase,
      this.getPaymentMethodsUseCase,
      this.processWebhookUseCase
    );

    // Start event consumer
    this.eventConsumer.start().catch((error) => {
      logger.error('Failed to start event consumer', { error });
    });
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  getPrisma(): PrismaClient {
    return this.prisma;
  }

  getPaymentRepository(): IPaymentRepository {
    return this.paymentRepository;
  }

  getPaymentTransactionRepository(): IPaymentTransactionRepository {
    return this.paymentTransactionRepository;
  }

  getRefundRepository(): IRefundRepository {
    return this.refundRepository;
  }

  getPaymentMethodRepository(): IPaymentMethodRepository {
    return this.paymentMethodRepository;
  }

  getPaymentWebhookRepository(): IPaymentWebhookRepository {
    return this.paymentWebhookRepository;
  }

  getOrderServiceClient(): IOrderServiceClient {
    return this.orderServiceClient;
  }

  getEventPublisher(): IEventPublisher {
    return this.eventPublisher;
  }

  getEventConsumer(): IEventConsumer {
    return this.eventConsumer;
  }

  getCreatePaymentUseCase(): CreatePaymentUseCase {
    return this.createPaymentUseCase;
  }

  getProcessPaymentUseCase(): ProcessPaymentUseCase {
    return this.processPaymentUseCase;
  }

  getRefundPaymentUseCase(): RefundPaymentUseCase {
    return this.refundPaymentUseCase;
  }

  getGetPaymentUseCase(): GetPaymentUseCase {
    return this.getPaymentUseCase;
  }

  getCreatePaymentMethodUseCase(): CreatePaymentMethodUseCase {
    return this.createPaymentMethodUseCase;
  }

  getGetPaymentMethodsUseCase(): GetPaymentMethodsUseCase {
    return this.getPaymentMethodsUseCase;
  }

  getProcessWebhookUseCase(): ProcessWebhookUseCase {
    return this.processWebhookUseCase;
  }

  getPaymentController(): PaymentController {
    return this.paymentController;
  }

  async disconnect(): Promise<void> {
    await this.eventConsumer.stop();
    await this.prisma.$disconnect();
  }
}

