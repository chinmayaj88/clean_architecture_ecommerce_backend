import { PrismaClient } from '@prisma/client';
import { ICartRepository } from '../ports/interfaces/ICartRepository';
import { ICartItemRepository } from '../ports/interfaces/ICartItemRepository';
import { IProductServiceClient } from '../ports/interfaces/IProductServiceClient';
import { PrismaCartRepository } from '../infrastructure/database/PrismaCartRepository';
import { PrismaCartItemRepository } from '../infrastructure/database/PrismaCartItemRepository';
import { ProductServiceClient } from '../infrastructure/clients/ProductServiceClient';
import { CreateCartUseCase } from '../core/use-cases/CreateCartUseCase';
import { GetCartUseCase } from '../core/use-cases/GetCartUseCase';
import { AddItemToCartUseCase } from '../core/use-cases/AddItemToCartUseCase';
import { UpdateCartItemUseCase } from '../core/use-cases/UpdateCartItemUseCase';
import { RemoveCartItemUseCase } from '../core/use-cases/RemoveCartItemUseCase';
import { ClearCartUseCase } from '../core/use-cases/ClearCartUseCase';
import { MergeCartsUseCase } from '../core/use-cases/MergeCartsUseCase';
import { CartController } from '../application/controllers/CartController';

export class Container {
  private static instance: Container;
  private prisma: PrismaClient;
  private cartRepository: ICartRepository;
  private cartItemRepository: ICartItemRepository;
  private productServiceClient: IProductServiceClient;
  private createCartUseCase: CreateCartUseCase;
  private getCartUseCase: GetCartUseCase;
  private addItemToCartUseCase: AddItemToCartUseCase;
  private updateCartItemUseCase: UpdateCartItemUseCase;
  private removeCartItemUseCase: RemoveCartItemUseCase;
  private clearCartUseCase: ClearCartUseCase;
  private mergeCartsUseCase: MergeCartsUseCase;
  private cartController: CartController;

  private constructor() {
    // Initialize Prisma
    this.prisma = new PrismaClient();

    // Initialize repositories
    this.cartRepository = new PrismaCartRepository(this.prisma);
    this.cartItemRepository = new PrismaCartItemRepository(this.prisma);

    // Initialize external clients
    this.productServiceClient = new ProductServiceClient();

    // Initialize use cases
    this.createCartUseCase = new CreateCartUseCase(this.cartRepository);
    this.getCartUseCase = new GetCartUseCase(this.cartRepository, this.cartItemRepository);
    this.addItemToCartUseCase = new AddItemToCartUseCase(
      this.cartRepository,
      this.cartItemRepository,
      this.productServiceClient
    );
    this.updateCartItemUseCase = new UpdateCartItemUseCase(
      this.cartRepository,
      this.cartItemRepository
    );
    this.removeCartItemUseCase = new RemoveCartItemUseCase(
      this.cartRepository,
      this.cartItemRepository
    );
    this.clearCartUseCase = new ClearCartUseCase(
      this.cartRepository,
      this.cartItemRepository
    );
    this.mergeCartsUseCase = new MergeCartsUseCase(
      this.cartRepository,
      this.cartItemRepository,
      this.addItemToCartUseCase
    );

    // Initialize controller
    this.cartController = new CartController(
      this.createCartUseCase,
      this.getCartUseCase,
      this.addItemToCartUseCase,
      this.updateCartItemUseCase,
      this.removeCartItemUseCase,
      this.clearCartUseCase,
      this.mergeCartsUseCase
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

  getCartRepository(): ICartRepository {
    return this.cartRepository;
  }

  getCartItemRepository(): ICartItemRepository {
    return this.cartItemRepository;
  }

  getProductServiceClient(): IProductServiceClient {
    return this.productServiceClient;
  }

  getCreateCartUseCase(): CreateCartUseCase {
    return this.createCartUseCase;
  }

  getGetCartUseCase(): GetCartUseCase {
    return this.getCartUseCase;
  }

  getAddItemToCartUseCase(): AddItemToCartUseCase {
    return this.addItemToCartUseCase;
  }

  getUpdateCartItemUseCase(): UpdateCartItemUseCase {
    return this.updateCartItemUseCase;
  }

  getRemoveCartItemUseCase(): RemoveCartItemUseCase {
    return this.removeCartItemUseCase;
  }

  getClearCartUseCase(): ClearCartUseCase {
    return this.clearCartUseCase;
  }

  getMergeCartsUseCase(): MergeCartsUseCase {
    return this.mergeCartsUseCase;
  }

  getCartController(): CartController {
    return this.cartController;
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

