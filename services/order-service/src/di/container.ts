import { PrismaClient } from '@prisma/client';
import { IOrderRepository } from '../ports/interfaces/IOrderRepository';
import { IOrderItemRepository } from '../ports/interfaces/IOrderItemRepository';
import { IOrderShippingAddressRepository } from '../ports/interfaces/IOrderShippingAddressRepository';
import { IOrderStatusHistoryRepository } from '../ports/interfaces/IOrderStatusHistoryRepository';
import { IOrderNoteRepository } from '../ports/interfaces/IOrderNoteRepository';
import { ICartServiceClient } from '../ports/interfaces/ICartServiceClient';
import { IProductServiceClient } from '../ports/interfaces/IProductServiceClient';
import { IUserServiceClient } from '../ports/interfaces/IUserServiceClient';
import { PrismaOrderRepository } from '../infrastructure/database/PrismaOrderRepository';
import { PrismaOrderItemRepository } from '../infrastructure/database/PrismaOrderItemRepository';
import { PrismaOrderShippingAddressRepository } from '../infrastructure/database/PrismaOrderShippingAddressRepository';
import { PrismaOrderStatusHistoryRepository } from '../infrastructure/database/PrismaOrderStatusHistoryRepository';
import { PrismaOrderNoteRepository } from '../infrastructure/database/PrismaOrderNoteRepository';
import { CartServiceClient } from '../infrastructure/clients/CartServiceClient';
import { ProductServiceClient } from '../infrastructure/clients/ProductServiceClient';
import { UserServiceClient } from '../infrastructure/clients/UserServiceClient';
import { IEventPublisher } from '../ports/interfaces/IEventPublisher';
import { CreateOrderUseCase } from '../core/use-cases/CreateOrderUseCase';
import { GetOrderUseCase } from '../core/use-cases/GetOrderUseCase';
import { UpdateOrderStatusUseCase } from '../core/use-cases/UpdateOrderStatusUseCase';
import { CancelOrderUseCase } from '../core/use-cases/CancelOrderUseCase';
import {
  CreateOrderNoteUseCase,
  GetOrderNotesUseCase,
  UpdateOrderNoteUseCase,
  DeleteOrderNoteUseCase,
} from '../core/use-cases/OrderNoteUseCases';
import { OrderController } from '../application/controllers/OrderController';
import { createEventPublisher } from '../infrastructure/events/EventPublisherFactory';

export class Container {
  private static instance: Container;
  private prisma: PrismaClient;
  private orderRepository: IOrderRepository;
  private orderItemRepository: IOrderItemRepository;
  private orderShippingAddressRepository: IOrderShippingAddressRepository;
  private orderStatusHistoryRepository: IOrderStatusHistoryRepository;
  private orderNoteRepository: IOrderNoteRepository;
  private cartServiceClient: ICartServiceClient;
  private productServiceClient: IProductServiceClient;
  private userServiceClient: IUserServiceClient;
  private eventPublisher: IEventPublisher;
  private createOrderUseCase: CreateOrderUseCase;
  private getOrderUseCase: GetOrderUseCase;
  private updateOrderStatusUseCase: UpdateOrderStatusUseCase;
  private cancelOrderUseCase: CancelOrderUseCase;
  private createOrderNoteUseCase: CreateOrderNoteUseCase;
  private getOrderNotesUseCase: GetOrderNotesUseCase;
  private updateOrderNoteUseCase: UpdateOrderNoteUseCase;
  private deleteOrderNoteUseCase: DeleteOrderNoteUseCase;
  private orderController: OrderController;

  private constructor() {
    // Initialize Prisma
    this.prisma = new PrismaClient();

    // Initialize repositories
    this.orderRepository = new PrismaOrderRepository(this.prisma);
    this.orderItemRepository = new PrismaOrderItemRepository(this.prisma);
    this.orderShippingAddressRepository = new PrismaOrderShippingAddressRepository(this.prisma);
    this.orderStatusHistoryRepository = new PrismaOrderStatusHistoryRepository(this.prisma);
    this.orderNoteRepository = new PrismaOrderNoteRepository(this.prisma);

    // Initialize external clients
    this.cartServiceClient = new CartServiceClient();
    this.productServiceClient = new ProductServiceClient();
    this.userServiceClient = new UserServiceClient();
    this.eventPublisher = createEventPublisher();

    // Initialize use cases
    this.createOrderUseCase = new CreateOrderUseCase(
      this.prisma,
      this.cartServiceClient,
      this.productServiceClient,
      this.userServiceClient,
      this.eventPublisher
    );
    this.getOrderUseCase = new GetOrderUseCase(
      this.orderRepository,
      this.orderItemRepository,
      this.orderShippingAddressRepository,
      this.orderStatusHistoryRepository
    );
    this.updateOrderStatusUseCase = new UpdateOrderStatusUseCase(
      this.orderRepository,
      this.orderStatusHistoryRepository,
      this.eventPublisher
    );
    this.cancelOrderUseCase = new CancelOrderUseCase(
      this.orderRepository,
      this.orderStatusHistoryRepository,
      this.eventPublisher
    );
    this.createOrderNoteUseCase = new CreateOrderNoteUseCase(
      this.orderNoteRepository,
      this.orderRepository
    );
    this.getOrderNotesUseCase = new GetOrderNotesUseCase(this.orderNoteRepository);
    this.updateOrderNoteUseCase = new UpdateOrderNoteUseCase(
      this.orderNoteRepository,
      this.orderRepository
    );
    this.deleteOrderNoteUseCase = new DeleteOrderNoteUseCase(this.orderNoteRepository);

    // Initialize controller
    this.orderController = new OrderController(
      this.createOrderUseCase,
      this.getOrderUseCase,
      this.updateOrderStatusUseCase,
      this.cancelOrderUseCase,
      this.createOrderNoteUseCase,
      this.getOrderNotesUseCase,
      this.updateOrderNoteUseCase,
      this.deleteOrderNoteUseCase
    );
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

  getOrderRepository(): IOrderRepository {
    return this.orderRepository;
  }

  getOrderItemRepository(): IOrderItemRepository {
    return this.orderItemRepository;
  }

  getOrderShippingAddressRepository(): IOrderShippingAddressRepository {
    return this.orderShippingAddressRepository;
  }

  getOrderStatusHistoryRepository(): IOrderStatusHistoryRepository {
    return this.orderStatusHistoryRepository;
  }

  getOrderNoteRepository(): IOrderNoteRepository {
    return this.orderNoteRepository;
  }

  getCartServiceClient(): ICartServiceClient {
    return this.cartServiceClient;
  }

  getProductServiceClient(): IProductServiceClient {
    return this.productServiceClient;
  }

  getUserServiceClient(): IUserServiceClient {
    return this.userServiceClient;
  }

  getCreateOrderUseCase(): CreateOrderUseCase {
    return this.createOrderUseCase;
  }

  getGetOrderUseCase(): GetOrderUseCase {
    return this.getOrderUseCase;
  }

  getUpdateOrderStatusUseCase(): UpdateOrderStatusUseCase {
    return this.updateOrderStatusUseCase;
  }

  getOrderController(): OrderController {
    return this.orderController;
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

