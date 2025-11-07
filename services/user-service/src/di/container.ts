/**
 * Dependency Injection Container
 * Manages all service dependencies
 */

import { PrismaClient } from '@prisma/client';
import { IUserProfileRepository } from '../ports/interfaces/IUserProfileRepository';
import { IAddressRepository } from '../ports/interfaces/IAddressRepository';
import { IPaymentMethodRepository } from '../ports/interfaces/IPaymentMethodRepository';
import { IUserPreferenceRepository } from '../ports/interfaces/IUserPreferenceRepository';
import { IWishlistItemRepository } from '../ports/interfaces/IWishlistItemRepository';
import { IRecentlyViewedProductRepository } from '../ports/interfaces/IRecentlyViewedProductRepository';
import { IUserActivityRepository } from '../ports/interfaces/IUserActivityRepository';
import { INotificationPreferenceRepository } from '../ports/interfaces/INotificationPreferenceRepository';
import { IAuthServiceClient } from '../ports/interfaces/IAuthServiceClient';
import { IEventConsumer } from '../ports/interfaces/IEventConsumer';

import { PrismaUserProfileRepository } from '../infrastructure/database/PrismaUserProfileRepository';
import { PrismaAddressRepository } from '../infrastructure/database/PrismaAddressRepository';
import { PrismaPaymentMethodRepository } from '../infrastructure/database/PrismaPaymentMethodRepository';
import { PrismaUserPreferenceRepository } from '../infrastructure/database/PrismaUserPreferenceRepository';
import { PrismaWishlistItemRepository } from '../infrastructure/database/PrismaWishlistItemRepository';
import { PrismaEventLogRepository } from '../infrastructure/database/PrismaEventLogRepository';
import { PrismaRecentlyViewedProductRepository } from '../infrastructure/database/PrismaRecentlyViewedProductRepository';
import { PrismaUserActivityRepository } from '../infrastructure/database/PrismaUserActivityRepository';
import { PrismaNotificationPreferenceRepository } from '../infrastructure/database/PrismaNotificationPreferenceRepository';
import { AuthServiceClient } from '../infrastructure/auth/AuthServiceClient';
import { SQSEventConsumer } from '../infrastructure/events/SQSEventConsumer';
import { createLogger } from '../infrastructure/logging/logger';
import { getEnvironmentConfig } from '../config/environment';

import { CreateUserProfileUseCase } from '../core/use-cases/CreateUserProfileUseCase';
import { GetUserProfileUseCase } from '../core/use-cases/GetUserProfileUseCase';
import { UpdateUserProfileUseCase } from '../core/use-cases/UpdateUserProfileUseCase';
import { CreateAddressUseCase } from '../core/use-cases/CreateAddressUseCase';
import { GetAddressesUseCase } from '../core/use-cases/GetAddressesUseCase';
import { UpdateAddressUseCase } from '../core/use-cases/UpdateAddressUseCase';
import { DeleteAddressUseCase } from '../core/use-cases/DeleteAddressUseCase';
import { CreatePaymentMethodUseCase } from '../core/use-cases/CreatePaymentMethodUseCase';
import { UpdatePaymentMethodUseCase } from '../core/use-cases/UpdatePaymentMethodUseCase';
import { DeletePaymentMethodUseCase } from '../core/use-cases/DeletePaymentMethodUseCase';
import { AddToWishlistUseCase } from '../core/use-cases/AddToWishlistUseCase';
import { GetWishlistUseCase } from '../core/use-cases/GetWishlistUseCase';
import { TrackProductViewUseCase } from '../core/use-cases/TrackProductViewUseCase';
import { GetRecentlyViewedProductsUseCase } from '../core/use-cases/GetRecentlyViewedProductsUseCase';
import { TrackUserActivityUseCase } from '../core/use-cases/TrackUserActivityUseCase';
import { GetUserActivityUseCase } from '../core/use-cases/GetUserActivityUseCase';
import { GetUserActivityStatsUseCase } from '../core/use-cases/GetUserActivityStatsUseCase';
import { CalculateProfileCompletionScoreUseCase } from '../core/use-cases/CalculateProfileCompletionScoreUseCase';
import { UpdateNotificationPreferenceUseCase } from '../core/use-cases/UpdateNotificationPreferenceUseCase';
import { GetNotificationPreferencesUseCase } from '../core/use-cases/GetNotificationPreferencesUseCase';
import { ExportUserDataUseCase } from '../core/use-cases/ExportUserDataUseCase';
import { DeleteUserDataUseCase } from '../core/use-cases/DeleteUserDataUseCase';
import { HandleUserCreatedEventUseCase } from '../core/use-cases/HandleUserCreatedEventUseCase';

import { UserController } from '../application/controllers/UserController';

const logger = createLogger();

export class Container {
  private static instance: Container;
  private prisma: PrismaClient;
  
  // Repositories
  private userProfileRepository: IUserProfileRepository;
  private addressRepository: IAddressRepository;
  private paymentMethodRepository: IPaymentMethodRepository;
  private _userPreferenceRepository: IUserPreferenceRepository; // Reserved for future use
  private wishlistItemRepository: IWishlistItemRepository;
  private recentlyViewedProductRepository: IRecentlyViewedProductRepository;
  private userActivityRepository: IUserActivityRepository;
  private notificationPreferenceRepository: INotificationPreferenceRepository;
  private _eventLogRepository: PrismaEventLogRepository; // Reserved for future use
  
  // External Services
  private authServiceClient: IAuthServiceClient;
  private eventConsumer: IEventConsumer;
  
  // Use Cases
  private _createUserProfileUseCase: CreateUserProfileUseCase; // Used in setupEventHandlers
  private getUserProfileUseCase: GetUserProfileUseCase;
  private updateUserProfileUseCase: UpdateUserProfileUseCase;
  private createAddressUseCase: CreateAddressUseCase;
  private getAddressesUseCase: GetAddressesUseCase;
  private updateAddressUseCase: UpdateAddressUseCase;
  private deleteAddressUseCase: DeleteAddressUseCase;
  private createPaymentMethodUseCase: CreatePaymentMethodUseCase;
  private updatePaymentMethodUseCase: UpdatePaymentMethodUseCase;
  private deletePaymentMethodUseCase: DeletePaymentMethodUseCase;
  private addToWishlistUseCase: AddToWishlistUseCase;
  private getWishlistUseCase: GetWishlistUseCase;
  private trackProductViewUseCase: TrackProductViewUseCase;
  private getRecentlyViewedProductsUseCase: GetRecentlyViewedProductsUseCase;
  private trackUserActivityUseCase: TrackUserActivityUseCase;
  private getUserActivityUseCase: GetUserActivityUseCase;
  private getUserActivityStatsUseCase: GetUserActivityStatsUseCase;
  private calculateProfileCompletionScoreUseCase: CalculateProfileCompletionScoreUseCase;
  private updateNotificationPreferenceUseCase: UpdateNotificationPreferenceUseCase;
  private getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase;
  private exportUserDataUseCase: ExportUserDataUseCase;
  private deleteUserDataUseCase: DeleteUserDataUseCase;
  private handleUserCreatedEventUseCase: HandleUserCreatedEventUseCase;
  
  // Controllers
  private userController: UserController;

  private constructor() {
    const envConfig = getEnvironmentConfig();
    const dbConfig = envConfig.getDatabaseConfig();
    
    this.prisma = new PrismaClient({
      log: envConfig.isDevelopment() 
        ? ['query', 'error', 'warn'] 
        : envConfig.isStaging()
        ? ['error', 'warn']
        : ['error'],
    });

    // Initialize repositories
    this.userProfileRepository = new PrismaUserProfileRepository(this.prisma);
    this.addressRepository = new PrismaAddressRepository(this.prisma);
    this.paymentMethodRepository = new PrismaPaymentMethodRepository(this.prisma);
    this._userPreferenceRepository = new PrismaUserPreferenceRepository(this.prisma);
    this.wishlistItemRepository = new PrismaWishlistItemRepository(this.prisma);
    this.recentlyViewedProductRepository = new PrismaRecentlyViewedProductRepository(this.prisma);
    this.userActivityRepository = new PrismaUserActivityRepository(this.prisma);
    this.notificationPreferenceRepository = new PrismaNotificationPreferenceRepository(this.prisma);
    this._eventLogRepository = new PrismaEventLogRepository(this.prisma);
    
    // References to avoid unused variable warnings (reserved for future use)
    void this._userPreferenceRepository;
    void this._eventLogRepository;

    // Initialize external services
    this.authServiceClient = new AuthServiceClient();
    this.eventConsumer = new SQSEventConsumer();

    // Initialize use cases
    this._createUserProfileUseCase = new CreateUserProfileUseCase(this.userProfileRepository);
    this.getUserProfileUseCase = new GetUserProfileUseCase(this.userProfileRepository);
    this.updateUserProfileUseCase = new UpdateUserProfileUseCase(
      this.userProfileRepository,
      this.addressRepository,
      this.paymentMethodRepository
    );
    this.createAddressUseCase = new CreateAddressUseCase(this.addressRepository);
    this.getAddressesUseCase = new GetAddressesUseCase(this.addressRepository);
    this.updateAddressUseCase = new UpdateAddressUseCase(this.addressRepository);
    this.deleteAddressUseCase = new DeleteAddressUseCase(this.addressRepository);
    this.createPaymentMethodUseCase = new CreatePaymentMethodUseCase(this.paymentMethodRepository);
    this.updatePaymentMethodUseCase = new UpdatePaymentMethodUseCase(this.paymentMethodRepository);
    this.deletePaymentMethodUseCase = new DeletePaymentMethodUseCase(this.paymentMethodRepository);
    this.addToWishlistUseCase = new AddToWishlistUseCase(this.wishlistItemRepository);
    this.getWishlistUseCase = new GetWishlistUseCase(this.wishlistItemRepository);
    this.trackProductViewUseCase = new TrackProductViewUseCase(
      this.recentlyViewedProductRepository,
      this.userActivityRepository
    );
    this.getRecentlyViewedProductsUseCase = new GetRecentlyViewedProductsUseCase(this.recentlyViewedProductRepository);
    this.trackUserActivityUseCase = new TrackUserActivityUseCase(this.userActivityRepository);
    this.getUserActivityUseCase = new GetUserActivityUseCase(this.userActivityRepository);
    this.getUserActivityStatsUseCase = new GetUserActivityStatsUseCase(this.userActivityRepository);
    this.calculateProfileCompletionScoreUseCase = new CalculateProfileCompletionScoreUseCase(this.userProfileRepository);
    this.updateNotificationPreferenceUseCase = new UpdateNotificationPreferenceUseCase(this.notificationPreferenceRepository);
    this.getNotificationPreferencesUseCase = new GetNotificationPreferencesUseCase(this.notificationPreferenceRepository);
    this.exportUserDataUseCase = new ExportUserDataUseCase(
      this.userProfileRepository,
      this.addressRepository,
      this.paymentMethodRepository,
      this.wishlistItemRepository,
      this.recentlyViewedProductRepository,
      this.userActivityRepository,
      this.notificationPreferenceRepository
    );
    this.deleteUserDataUseCase = new DeleteUserDataUseCase(
      this.userProfileRepository,
      this.addressRepository,
      this.paymentMethodRepository,
      this.wishlistItemRepository,
      this.recentlyViewedProductRepository,
      this.userActivityRepository,
      this.notificationPreferenceRepository
    );
    this.handleUserCreatedEventUseCase = new HandleUserCreatedEventUseCase(this.userProfileRepository);

    // Initialize controllers
    this.userController = new UserController(
      this.getUserProfileUseCase,
      this.updateUserProfileUseCase,
      this.createAddressUseCase,
      this.getAddressesUseCase,
      this.updateAddressUseCase,
      this.deleteAddressUseCase,
      this.createPaymentMethodUseCase,
      this.updatePaymentMethodUseCase,
      this.deletePaymentMethodUseCase,
      this.addToWishlistUseCase,
      this.getWishlistUseCase,
      this.trackProductViewUseCase,
      this.getRecentlyViewedProductsUseCase,
      this.trackUserActivityUseCase,
      this.getUserActivityUseCase,
      this.getUserActivityStatsUseCase,
      this.calculateProfileCompletionScoreUseCase,
      this.updateNotificationPreferenceUseCase,
      this.getNotificationPreferencesUseCase,
      this.exportUserDataUseCase,
      this.deleteUserDataUseCase,
      this.addressRepository,
      this.paymentMethodRepository,
      this.wishlistItemRepository
    );

    // Set up event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Subscribe to user.created event
    this.eventConsumer.subscribe('user.created', async (event) => {
      try {
        const eventData = event as { userId: string; email: string; timestamp: string; source: string };
        await this.handleUserCreatedEventUseCase.execute(eventData);
        logger.info('User created event processed', { userId: eventData.userId });
      } catch (error) {
        logger.error('Failed to process user.created event', { error });
      }
    });
    
    // Reference to avoid unused variable warning
    void this._createUserProfileUseCase;
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  // Getters
  public getPrisma(): PrismaClient {
    return this.prisma;
  }

  public getUserProfileRepository(): IUserProfileRepository {
    return this.userProfileRepository;
  }

  public getAddressRepository(): IAddressRepository {
    return this.addressRepository;
  }

  public getPaymentMethodRepository(): IPaymentMethodRepository {
    return this.paymentMethodRepository;
  }

  public getWishlistItemRepository(): IWishlistItemRepository {
    return this.wishlistItemRepository;
  }

  public getAuthServiceClient(): IAuthServiceClient {
    return this.authServiceClient;
  }

  public getEventConsumer(): IEventConsumer {
    return this.eventConsumer;
  }

  public getUserController(): UserController {
    return this.userController;
  }

  public async startEventConsumer(): Promise<void> {
    await this.eventConsumer.start();
  }

  public async dispose(): Promise<void> {
    try {
      await this.eventConsumer.stop();
      await this.prisma.$disconnect();
      logger.info('Container disposed');
    } catch (error) {
      logger.error('Error disposing container', { error });
    }
  }
}

