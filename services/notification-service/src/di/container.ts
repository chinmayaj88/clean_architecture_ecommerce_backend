import { PrismaClient } from '@prisma/client';
import { getEnvConfig } from '../config/env';
import { createLogger } from '../infrastructure/logging/logger';

// Repositories
import { PrismaNotificationRepository } from '../infrastructure/database/PrismaNotificationRepository';
import { PrismaEmailTemplateRepository } from '../infrastructure/database/PrismaEmailTemplateRepository';
import { PrismaNotificationPreferenceRepository } from '../infrastructure/database/PrismaNotificationPreferenceRepository';
import { PrismaNotificationLogRepository } from '../infrastructure/database/PrismaNotificationLogRepository';

// Providers
import { createNotificationProvider } from '../infrastructure/providers/NotificationProviderFactory';

// Use Cases
import { SendNotificationUseCase } from '../core/use-cases/SendNotificationUseCase';

// Controllers
import { NotificationController } from '../application/controllers/NotificationController';
import { EmailTemplateController } from '../application/controllers/EmailTemplateController';
import { NotificationPreferenceController } from '../application/controllers/NotificationPreferenceController';

// Event Consumer
import { SQSEventConsumer } from '../infrastructure/events/SQSEventConsumer';
import { NotificationEventHandlers } from '../infrastructure/events/NotificationEventHandlers';
import { IEventConsumer } from '../ports/interfaces/IEventConsumer';

// Clients
import { UserServiceClient, IUserServiceClient } from '../infrastructure/clients/UserServiceClient';

// Jobs
import { ScheduledNotificationProcessor } from '../infrastructure/jobs/ScheduledNotificationProcessor';

// Interfaces
import { INotificationRepository } from '../ports/interfaces/INotificationRepository';
import { IEmailTemplateRepository } from '../ports/interfaces/IEmailTemplateRepository';
import { INotificationPreferenceRepository } from '../ports/interfaces/INotificationPreferenceRepository';
import { INotificationLogRepository } from '../ports/interfaces/INotificationLogRepository';
import { INotificationProvider } from '../ports/interfaces/INotificationProvider';

const logger = createLogger();
const config = getEnvConfig();

export class Container {
  private static instance: Container;
  private prisma: PrismaClient;
  private notificationRepository: INotificationRepository;
  private emailTemplateRepository: IEmailTemplateRepository;
  private notificationPreferenceRepository: INotificationPreferenceRepository;
  private notificationLogRepository: INotificationLogRepository;
  private notificationProvider: INotificationProvider;
  private sendNotificationUseCase: SendNotificationUseCase;
  private notificationController: NotificationController;
  private emailTemplateController: EmailTemplateController;
  private notificationPreferenceController: NotificationPreferenceController;
  private eventConsumer: IEventConsumer;
  private eventHandlers: NotificationEventHandlers;
  private userServiceClient: IUserServiceClient;
  private scheduledNotificationProcessor: ScheduledNotificationProcessor;

  private constructor() {
    // Initialize Prisma
    this.prisma = new PrismaClient({
      log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Initialize repositories
    this.notificationRepository = new PrismaNotificationRepository(this.prisma);
    this.emailTemplateRepository = new PrismaEmailTemplateRepository(this.prisma);
    this.notificationPreferenceRepository = new PrismaNotificationPreferenceRepository(this.prisma);
    this.notificationLogRepository = new PrismaNotificationLogRepository(this.prisma);

    // Initialize providers
    this.notificationProvider = createNotificationProvider();

    // Initialize use cases
    this.sendNotificationUseCase = new SendNotificationUseCase(
      this.prisma,
      this.notificationRepository,
      this.notificationLogRepository,
      this.notificationPreferenceRepository,
      this.notificationProvider
    );

    // Initialize clients
    this.userServiceClient = new UserServiceClient();

    // Initialize controllers
    this.notificationController = new NotificationController(
      this.sendNotificationUseCase,
      this.notificationRepository
    );
    this.emailTemplateController = new EmailTemplateController(
      this.emailTemplateRepository
    );
    this.notificationPreferenceController = new NotificationPreferenceController(
      this.notificationPreferenceRepository
    );

    // Initialize event handlers
    this.eventHandlers = new NotificationEventHandlers(
      this.sendNotificationUseCase,
      this.emailTemplateRepository,
      this.userServiceClient
    );

    // Initialize event consumer
    this.eventConsumer = new SQSEventConsumer();
    this.setupEventHandlers();

    // Initialize scheduled notification processor
    this.scheduledNotificationProcessor = new ScheduledNotificationProcessor(
      this.notificationRepository,
      this.sendNotificationUseCase
    );

    logger.info('Container initialized');
  }

  private setupEventHandlers(): void {
    // Register event handlers
    this.eventConsumer.subscribe('user.created', (event) => 
      this.eventHandlers.handleUserCreated(event as any)
    );
    this.eventConsumer.subscribe('user.email.verification.requested', (event) => 
      this.eventHandlers.handleEmailVerificationRequested(event as any)
    );
    this.eventConsumer.subscribe('user.password.reset.requested', (event) => 
      this.eventHandlers.handlePasswordResetRequested(event as any)
    );
    this.eventConsumer.subscribe('order.created', (event) => 
      this.eventHandlers.handleOrderCreated(event as any)
    );
    this.eventConsumer.subscribe('order.shipped', (event) => 
      this.eventHandlers.handleOrderShipped(event as any)
    );
    this.eventConsumer.subscribe('order.cancelled', (event) => 
      this.eventHandlers.handleOrderCancelled(event as any)
    );
    this.eventConsumer.subscribe('order.delivered', (event) => 
      this.eventHandlers.handleOrderDelivered(event as any)
    );
    this.eventConsumer.subscribe('payment.succeeded', (event) => 
      this.eventHandlers.handlePaymentSucceeded(event as any)
    );
    this.eventConsumer.subscribe('payment.failed', (event) => 
      this.eventHandlers.handlePaymentFailed(event as any)
    );
    this.eventConsumer.subscribe('payment.refunded', (event) => 
      this.eventHandlers.handlePaymentRefunded(event as any)
    );

    logger.info('Event handlers registered');
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

  getNotificationRepository(): INotificationRepository {
    return this.notificationRepository;
  }

  getEmailTemplateRepository(): IEmailTemplateRepository {
    return this.emailTemplateRepository;
  }

  getNotificationPreferenceRepository(): INotificationPreferenceRepository {
    return this.notificationPreferenceRepository;
  }

  getNotificationLogRepository(): INotificationLogRepository {
    return this.notificationLogRepository;
  }

  getNotificationProvider(): INotificationProvider {
    return this.notificationProvider;
  }

  getSendNotificationUseCase(): SendNotificationUseCase {
    return this.sendNotificationUseCase;
  }

  getNotificationController(): NotificationController {
    return this.notificationController;
  }

  getEmailTemplateController(): EmailTemplateController {
    return this.emailTemplateController;
  }

  getNotificationPreferenceController(): NotificationPreferenceController {
    return this.notificationPreferenceController;
  }

  getEventConsumer(): IEventConsumer {
    return this.eventConsumer;
  }

  getUserServiceClient(): IUserServiceClient {
    return this.userServiceClient;
  }

  getScheduledNotificationProcessor(): ScheduledNotificationProcessor {
    return this.scheduledNotificationProcessor;
  }

  async disconnect(): Promise<void> {
    // Stop scheduled notification processor
    if (this.scheduledNotificationProcessor) {
      this.scheduledNotificationProcessor.stop();
    }

    // Stop event consumer
    if (this.eventConsumer) {
      await this.eventConsumer.stop();
    }
    
    await this.prisma.$disconnect();
    logger.info('Prisma disconnected');
  }
}


