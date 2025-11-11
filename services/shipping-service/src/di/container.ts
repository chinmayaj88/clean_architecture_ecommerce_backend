import { PrismaClient } from '@prisma/client';
import { getEnvConfig } from '../config/env';

// Repositories
import { PrismaShippingZoneRepository } from '../infrastructure/database/PrismaShippingZoneRepository';
import { PrismaShippingMethodRepository } from '../infrastructure/database/PrismaShippingMethodRepository';
import { PrismaShippingRateRepository } from '../infrastructure/database/PrismaShippingRateRepository';
import { PrismaShipmentRepository } from '../infrastructure/database/PrismaShipmentRepository';
import { PrismaShipmentTrackingRepository } from '../infrastructure/database/PrismaShipmentTrackingRepository';
import { PrismaCarrierRepository } from '../infrastructure/database/PrismaCarrierRepository';

// Use Cases
import { CalculateShippingRateUseCase } from '../core/use-cases/CalculateShippingRateUseCase';
import { CreateShipmentUseCase } from '../core/use-cases/CreateShipmentUseCase';
import { GetShipmentTrackingUseCase } from '../core/use-cases/GetShipmentTrackingUseCase';
import { UpdateShipmentStatusUseCase } from '../core/use-cases/UpdateShipmentStatusUseCase';

// Controllers
import { ShippingRateController } from '../application/controllers/ShippingRateController';
import { ShipmentController } from '../application/controllers/ShipmentController';
import { ShippingZoneController } from '../application/controllers/ShippingZoneController';
import { ShippingMethodController } from '../application/controllers/ShippingMethodController';

// Interfaces
import { IShippingZoneRepository } from '../ports/interfaces/IShippingZoneRepository';
import { IShippingMethodRepository } from '../ports/interfaces/IShippingMethodRepository';
import { IShippingRateRepository } from '../ports/interfaces/IShippingRateRepository';
import { IShipmentRepository } from '../ports/interfaces/IShipmentRepository';
import { IShipmentTrackingRepository } from '../ports/interfaces/IShipmentTrackingRepository';
import { ICarrierRepository } from '../ports/interfaces/ICarrierRepository';

// Clients
import { OrderServiceClient, IOrderServiceClient } from '../infrastructure/clients/OrderServiceClient';
import { ProductServiceClient, IProductServiceClient } from '../infrastructure/clients/ProductServiceClient';

// Events
import { SQSEventConsumer } from '../infrastructure/events/SQSEventConsumer';
import { ShippingEventHandlers } from '../infrastructure/events/ShippingEventHandlers';
import { IEventConsumer } from '../ports/interfaces/IEventConsumer';
import { createLogger } from '../infrastructure/logging/logger';

const config = getEnvConfig();
const logger = createLogger();

export class Container {
  private static instance: Container;
  private prisma: PrismaClient;
  private shippingZoneRepository: IShippingZoneRepository;
  private shippingMethodRepository: IShippingMethodRepository;
  private shippingRateRepository: IShippingRateRepository;
  private shipmentRepository: IShipmentRepository;
  private shipmentTrackingRepository: IShipmentTrackingRepository;
  private carrierRepository: ICarrierRepository;
  private calculateShippingRateUseCase: CalculateShippingRateUseCase;
  private createShipmentUseCase: CreateShipmentUseCase;
  private getShipmentTrackingUseCase: GetShipmentTrackingUseCase;
  private updateShipmentStatusUseCase: UpdateShipmentStatusUseCase;
  private shippingRateController: ShippingRateController;
  private shipmentController: ShipmentController;
  private shippingZoneController: ShippingZoneController;
  private shippingMethodController: ShippingMethodController;
  private orderServiceClient: IOrderServiceClient;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _productServiceClient: IProductServiceClient;
  private eventConsumer: IEventConsumer;
  private eventHandlers: ShippingEventHandlers;

  private constructor() {
    // Initialize Prisma
    this.prisma = new PrismaClient({
      log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Initialize repositories
    this.shippingZoneRepository = new PrismaShippingZoneRepository(this.prisma);
    this.shippingMethodRepository = new PrismaShippingMethodRepository(this.prisma);
    this.shippingRateRepository = new PrismaShippingRateRepository(this.prisma);
    this.shipmentRepository = new PrismaShipmentRepository(this.prisma);
    this.shipmentTrackingRepository = new PrismaShipmentTrackingRepository(this.prisma);
    this.carrierRepository = new PrismaCarrierRepository(this.prisma);

    // Initialize use cases
    this.calculateShippingRateUseCase = new CalculateShippingRateUseCase(
      this.shippingZoneRepository,
      this.shippingMethodRepository,
      this.shippingRateRepository
    );

    this.createShipmentUseCase = new CreateShipmentUseCase(
      this.shipmentRepository,
      this.shippingMethodRepository,
      this.carrierRepository
    );

    this.getShipmentTrackingUseCase = new GetShipmentTrackingUseCase(
      this.shipmentRepository,
      this.shipmentTrackingRepository
    );

    this.updateShipmentStatusUseCase = new UpdateShipmentStatusUseCase(
      this.shipmentRepository,
      this.shipmentTrackingRepository
    );

    // Initialize controllers
    this.shippingRateController = new ShippingRateController(
      this.calculateShippingRateUseCase
    );

    this.shipmentController = new ShipmentController(
      this.createShipmentUseCase,
      this.getShipmentTrackingUseCase,
      this.updateShipmentStatusUseCase,
      this.shipmentRepository
    );

    this.shippingZoneController = new ShippingZoneController(
      this.shippingZoneRepository
    );

    this.shippingMethodController = new ShippingMethodController(
      this.shippingMethodRepository
    );

    // Initialize service clients
    this.orderServiceClient = new OrderServiceClient();
    this._productServiceClient = new ProductServiceClient();

    // Initialize event handlers
    this.eventHandlers = new ShippingEventHandlers(
      this.createShipmentUseCase, // Passed for future use in handleOrderCreated
      this.updateShipmentStatusUseCase,
      this.shipmentRepository,
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
    this.eventConsumer.subscribe('order.shipped', (event) =>
      this.eventHandlers.handleOrderShipped(event as any)
    );
    this.eventConsumer.subscribe('order.delivered', (event) =>
      this.eventHandlers.handleOrderDelivered(event as any)
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

  public getShippingRateController(): ShippingRateController {
    return this.shippingRateController;
  }

  public getShipmentController(): ShipmentController {
    return this.shipmentController;
  }

  public getShippingZoneController(): ShippingZoneController {
    return this.shippingZoneController;
  }

  public getShippingMethodController(): ShippingMethodController {
    return this.shippingMethodController;
  }

  public getEventConsumer(): IEventConsumer {
    return this.eventConsumer;
  }

  public async disconnect(): Promise<void> {
    await this.eventConsumer.stop();
    await this.prisma.$disconnect();
  }
}

