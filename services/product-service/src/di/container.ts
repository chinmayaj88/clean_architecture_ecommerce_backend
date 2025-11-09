import { PrismaClient } from '@prisma/client';
import { IProductRepository } from '../ports/interfaces/IProductRepository';
import { IProductQuestionRepository } from '../ports/interfaces/IProductQuestionRepository';
import { IStockAlertRepository } from '../ports/interfaces/IStockAlertRepository';
import { IProductReviewRepository } from '../ports/interfaces/IProductReviewRepository';
import { IProductComparisonRepository } from '../ports/interfaces/IProductComparisonRepository';
import { ICategoryRepository } from '../ports/interfaces/ICategoryRepository';
import { IProductVariantRepository } from '../ports/interfaces/IProductVariantRepository';
import { IProductImageRepository } from '../ports/interfaces/IProductImageRepository';
import { IProductTagRepository } from '../ports/interfaces/IProductTagRepository';
import { IProductInventoryRepository } from '../ports/interfaces/IProductInventoryRepository';
import { IPriceHistoryRepository } from '../ports/interfaces/IPriceHistoryRepository';
import { IProductSearchHistoryRepository } from '../ports/interfaces/IProductSearchHistoryRepository';
import { PrismaProductRepository } from '../infrastructure/database/PrismaProductRepository';
import { PrismaProductQuestionRepository } from '../infrastructure/database/PrismaProductQuestionRepository';
import { PrismaStockAlertRepository } from '../infrastructure/database/PrismaStockAlertRepository';
import { PrismaProductReviewRepository } from '../infrastructure/database/PrismaProductReviewRepository';
import { PrismaProductComparisonRepository } from '../infrastructure/database/PrismaProductComparisonRepository';
import { PrismaCategoryRepository } from '../infrastructure/database/PrismaCategoryRepository';
import { PrismaProductVariantRepository } from '../infrastructure/database/PrismaProductVariantRepository';
import { PrismaProductImageRepository } from '../infrastructure/database/PrismaProductImageRepository';
import { PrismaProductTagRepository } from '../infrastructure/database/PrismaProductTagRepository';
import { PrismaProductInventoryRepository } from '../infrastructure/database/PrismaProductInventoryRepository';
import { PrismaPriceHistoryRepository } from '../infrastructure/database/PrismaPriceHistoryRepository';
import { PrismaProductSearchHistoryRepository } from '../infrastructure/database/PrismaProductSearchHistoryRepository';
import { IEventPublisher } from '../ports/interfaces/IEventPublisher';
import { createEventPublisher } from '../infrastructure/events/EventPublisherFactory';
import { CreateProductUseCase } from '../core/use-cases/CreateProductUseCase';
import { GetProductUseCase } from '../core/use-cases/GetProductUseCase';
import { ListProductsUseCase } from '../core/use-cases/ListProductsUseCase';
import { UpdateProductUseCase } from '../core/use-cases/UpdateProductUseCase';
import { DeleteProductUseCase } from '../core/use-cases/DeleteProductUseCase';
import { SearchProductsUseCase } from '../core/use-cases/SearchProductsUseCase';
import { GetProductRecommendationsUseCase } from '../core/use-cases/GetProductRecommendationsUseCase';
import { TrackProductViewUseCase } from '../core/use-cases/TrackProductViewUseCase';
import { CreateProductQuestionUseCase } from '../core/use-cases/CreateProductQuestionUseCase';
import { GetProductQuestionsUseCase } from '../core/use-cases/GetProductQuestionsUseCase';
import { AnswerProductQuestionUseCase } from '../core/use-cases/AnswerProductQuestionUseCase';
import { CreateStockAlertUseCase } from '../core/use-cases/CreateStockAlertUseCase';
import { GetStockAlertsUseCase } from '../core/use-cases/GetStockAlertsUseCase';
import { CreateProductReviewUseCase } from '../core/use-cases/CreateProductReviewUseCase';
import { GetProductReviewsUseCase } from '../core/use-cases/GetProductReviewsUseCase';
import { ModerateReviewUseCase } from '../core/use-cases/ModerateReviewUseCase';
import { CreateProductComparisonUseCase } from '../core/use-cases/CreateProductComparisonUseCase';
import { GetProductComparisonUseCase } from '../core/use-cases/GetProductComparisonUseCase';
import { UpdateProductBadgesUseCase } from '../core/use-cases/UpdateProductBadgesUseCase';
import { CreateCategoryUseCase } from '../core/use-cases/CreateCategoryUseCase';
import { GetCategoryUseCase } from '../core/use-cases/GetCategoryUseCase';
import { ListCategoriesUseCase } from '../core/use-cases/ListCategoriesUseCase';
import { UpdateCategoryUseCase } from '../core/use-cases/UpdateCategoryUseCase';
import { DeleteCategoryUseCase } from '../core/use-cases/DeleteCategoryUseCase';
import {
  CreateProductVariantUseCase,
  GetProductVariantUseCase,
  UpdateProductVariantUseCase,
  DeleteProductVariantUseCase,
} from '../core/use-cases/ProductVariantUseCases';
import {
  CreateProductImageUseCase,
  GetProductImageUseCase,
  UpdateProductImageUseCase,
  DeleteProductImageUseCase,
  SetPrimaryImageUseCase,
} from '../core/use-cases/ProductImageUseCases';
import {
  CreateProductTagUseCase,
  GetProductTagUseCase,
  DeleteProductTagUseCase,
} from '../core/use-cases/ProductTagUseCases';
import {
  CreateProductInventoryUseCase,
  GetProductInventoryUseCase,
  ReserveInventoryUseCase,
  ReleaseInventoryUseCase,
  AdjustInventoryUseCase,
} from '../core/use-cases/ProductInventoryUseCases';
import {
  GetPriceHistoryUseCase,
} from '../core/use-cases/PriceHistoryUseCases';
import {
  GetSearchHistoryUseCase,
} from '../core/use-cases/ProductSearchHistoryUseCases';
import { ProductController } from '../application/controllers/ProductController';
import { CategoryController } from '../application/controllers/CategoryController';
import { ProductVariantController } from '../application/controllers/ProductVariantController';
import { ProductImageController } from '../application/controllers/ProductImageController';
import { ProductTagController } from '../application/controllers/ProductTagController';
import { ProductInventoryController } from '../application/controllers/ProductInventoryController';
import { createLogger } from '../infrastructure/logging/logger';
import { getEnvironmentConfig } from '../config/environment';

const logger = createLogger();

export class Container {
  private static instance: Container;
  private prisma: PrismaClient;
  private productRepository: IProductRepository;
  private productQuestionRepository: IProductQuestionRepository;
  private stockAlertRepository: IStockAlertRepository;
  private productReviewRepository: IProductReviewRepository;
  private productComparisonRepository: IProductComparisonRepository;
  private categoryRepository: ICategoryRepository;
  private productVariantRepository: IProductVariantRepository;
  private productImageRepository: IProductImageRepository;
  private productTagRepository: IProductTagRepository;
  private productInventoryRepository: IProductInventoryRepository;
  private priceHistoryRepository: IPriceHistoryRepository;
  private productSearchHistoryRepository: IProductSearchHistoryRepository;
  private eventPublisher: IEventPublisher;
  private createProductUseCase: CreateProductUseCase;
  private getProductUseCase: GetProductUseCase;
  private listProductsUseCase: ListProductsUseCase;
  private updateProductUseCase: UpdateProductUseCase;
  private deleteProductUseCase: DeleteProductUseCase;
  private searchProductsUseCase: SearchProductsUseCase;
  private getProductRecommendationsUseCase: GetProductRecommendationsUseCase;
  private trackProductViewUseCase: TrackProductViewUseCase;
  private createProductQuestionUseCase: CreateProductQuestionUseCase;
  private getProductQuestionsUseCase: GetProductQuestionsUseCase;
  private answerProductQuestionUseCase: AnswerProductQuestionUseCase;
  private createStockAlertUseCase: CreateStockAlertUseCase;
  private getStockAlertsUseCase: GetStockAlertsUseCase;
  private createProductReviewUseCase: CreateProductReviewUseCase;
  private getProductReviewsUseCase: GetProductReviewsUseCase;
  private moderateReviewUseCase: ModerateReviewUseCase;
  private createProductComparisonUseCase: CreateProductComparisonUseCase;
  private getProductComparisonUseCase: GetProductComparisonUseCase;
  private updateProductBadgesUseCase: UpdateProductBadgesUseCase;
  private createCategoryUseCase: CreateCategoryUseCase;
  private getCategoryUseCase: GetCategoryUseCase;
  private listCategoriesUseCase: ListCategoriesUseCase;
  private updateCategoryUseCase: UpdateCategoryUseCase;
  private deleteCategoryUseCase: DeleteCategoryUseCase;
  private createProductVariantUseCase: CreateProductVariantUseCase;
  private getProductVariantUseCase: GetProductVariantUseCase;
  private updateProductVariantUseCase: UpdateProductVariantUseCase;
  private deleteProductVariantUseCase: DeleteProductVariantUseCase;
  private createProductImageUseCase: CreateProductImageUseCase;
  private getProductImageUseCase: GetProductImageUseCase;
  private updateProductImageUseCase: UpdateProductImageUseCase;
  private deleteProductImageUseCase: DeleteProductImageUseCase;
  private setPrimaryImageUseCase: SetPrimaryImageUseCase;
  private createProductTagUseCase: CreateProductTagUseCase;
  private getProductTagUseCase: GetProductTagUseCase;
  private deleteProductTagUseCase: DeleteProductTagUseCase;
  private createProductInventoryUseCase: CreateProductInventoryUseCase;
  private getProductInventoryUseCase: GetProductInventoryUseCase;
  private reserveInventoryUseCase: ReserveInventoryUseCase;
  private releaseInventoryUseCase: ReleaseInventoryUseCase;
  private adjustInventoryUseCase: AdjustInventoryUseCase;
  private getPriceHistoryUseCase: GetPriceHistoryUseCase;
  private getSearchHistoryUseCase: GetSearchHistoryUseCase;
  private productController: ProductController;
  private categoryController: CategoryController;
  private productVariantController: ProductVariantController;
  private productImageController: ProductImageController;
  private productTagController: ProductTagController;
  private productInventoryController: ProductInventoryController;

  private constructor() {
    const envConfig = getEnvironmentConfig();
    // const dbConfig = envConfig.getDatabaseConfig(); // Not used currently
    
    this.prisma = new PrismaClient({
      log: envConfig.isDevelopment() 
        ? ['query', 'error', 'warn'] 
        : envConfig.isStaging()
        ? ['error', 'warn']
        : ['error'],
    });

    this.productRepository = new PrismaProductRepository(this.prisma);
    this.productQuestionRepository = new PrismaProductQuestionRepository(this.prisma);
    this.stockAlertRepository = new PrismaStockAlertRepository(this.prisma);
    this.productReviewRepository = new PrismaProductReviewRepository(this.prisma);
    this.productComparisonRepository = new PrismaProductComparisonRepository(this.prisma);
    this.categoryRepository = new PrismaCategoryRepository(this.prisma);
    this.productVariantRepository = new PrismaProductVariantRepository(this.prisma);
    this.productImageRepository = new PrismaProductImageRepository(this.prisma);
    this.productTagRepository = new PrismaProductTagRepository(this.prisma);
    this.productInventoryRepository = new PrismaProductInventoryRepository(this.prisma);
    this.priceHistoryRepository = new PrismaPriceHistoryRepository(this.prisma);
    this.productSearchHistoryRepository = new PrismaProductSearchHistoryRepository(this.prisma);
    this.eventPublisher = createEventPublisher();

    this.createProductUseCase = new CreateProductUseCase(
      this.productRepository,
      this.eventPublisher
    );
    this.getProductUseCase = new GetProductUseCase(this.productRepository);
    this.listProductsUseCase = new ListProductsUseCase(this.productRepository);
    this.updateProductUseCase = new UpdateProductUseCase(
      this.productRepository,
      this.priceHistoryRepository,
      this.eventPublisher
    );
    this.deleteProductUseCase = new DeleteProductUseCase(
      this.productRepository,
      this.eventPublisher
    );
    this.searchProductsUseCase = new SearchProductsUseCase(
      this.productRepository,
      this.productSearchHistoryRepository
    );
    this.getProductRecommendationsUseCase = new GetProductRecommendationsUseCase(this.productRepository);
    this.trackProductViewUseCase = new TrackProductViewUseCase(this.productRepository);
    this.createProductQuestionUseCase = new CreateProductQuestionUseCase(
      this.productQuestionRepository,
      this.productRepository
    );
    this.getProductQuestionsUseCase = new GetProductQuestionsUseCase(this.productQuestionRepository);
    this.answerProductQuestionUseCase = new AnswerProductQuestionUseCase(this.productQuestionRepository);
    this.createStockAlertUseCase = new CreateStockAlertUseCase(
      this.stockAlertRepository,
      this.productRepository
    );
    this.getStockAlertsUseCase = new GetStockAlertsUseCase(this.stockAlertRepository);
    this.createProductReviewUseCase = new CreateProductReviewUseCase(
      this.productReviewRepository,
      this.productRepository
    );
    this.getProductReviewsUseCase = new GetProductReviewsUseCase(this.productReviewRepository);
    this.moderateReviewUseCase = new ModerateReviewUseCase(this.productReviewRepository);
    this.createProductComparisonUseCase = new CreateProductComparisonUseCase(
      this.productComparisonRepository,
      this.productRepository
    );
    this.getProductComparisonUseCase = new GetProductComparisonUseCase(
      this.productComparisonRepository,
      this.productRepository
    );
    this.updateProductBadgesUseCase = new UpdateProductBadgesUseCase(this.productRepository);

    // Category use cases
    this.createCategoryUseCase = new CreateCategoryUseCase(this.categoryRepository);
    this.getCategoryUseCase = new GetCategoryUseCase(this.categoryRepository);
    this.listCategoriesUseCase = new ListCategoriesUseCase(this.categoryRepository);
    this.updateCategoryUseCase = new UpdateCategoryUseCase(this.categoryRepository);
    this.deleteCategoryUseCase = new DeleteCategoryUseCase(this.categoryRepository);

    // Product variant use cases
    this.createProductVariantUseCase = new CreateProductVariantUseCase(
      this.productVariantRepository,
      this.productRepository
    );
    this.getProductVariantUseCase = new GetProductVariantUseCase(this.productVariantRepository);
    this.updateProductVariantUseCase = new UpdateProductVariantUseCase(this.productVariantRepository);
    this.deleteProductVariantUseCase = new DeleteProductVariantUseCase(this.productVariantRepository);

    // Product image use cases
    this.createProductImageUseCase = new CreateProductImageUseCase(
      this.productImageRepository,
      this.productRepository
    );
    this.getProductImageUseCase = new GetProductImageUseCase(this.productImageRepository);
    this.updateProductImageUseCase = new UpdateProductImageUseCase(this.productImageRepository);
    this.deleteProductImageUseCase = new DeleteProductImageUseCase(this.productImageRepository);
    this.setPrimaryImageUseCase = new SetPrimaryImageUseCase(this.productImageRepository);

    // Product tag use cases
    this.createProductTagUseCase = new CreateProductTagUseCase(
      this.productTagRepository,
      this.productRepository
    );
    this.getProductTagUseCase = new GetProductTagUseCase(this.productTagRepository);
    this.deleteProductTagUseCase = new DeleteProductTagUseCase(this.productTagRepository);

    // Product inventory use cases
    this.createProductInventoryUseCase = new CreateProductInventoryUseCase(
      this.productInventoryRepository,
      this.productRepository
    );
    this.getProductInventoryUseCase = new GetProductInventoryUseCase(this.productInventoryRepository);
    this.reserveInventoryUseCase = new ReserveInventoryUseCase(this.productInventoryRepository);
    this.releaseInventoryUseCase = new ReleaseInventoryUseCase(this.productInventoryRepository);
    this.adjustInventoryUseCase = new AdjustInventoryUseCase(this.productInventoryRepository);

    // Price history use cases
    this.getPriceHistoryUseCase = new GetPriceHistoryUseCase(this.priceHistoryRepository);

    // Search history use cases
    this.getSearchHistoryUseCase = new GetSearchHistoryUseCase(this.productSearchHistoryRepository);

    this.productController = new ProductController(
      this.createProductUseCase,
      this.getProductUseCase,
      this.listProductsUseCase,
      this.updateProductUseCase,
      this.deleteProductUseCase,
      this.searchProductsUseCase,
      this.getProductRecommendationsUseCase,
      this.trackProductViewUseCase,
      this.createProductQuestionUseCase,
      this.getProductQuestionsUseCase,
      this.answerProductQuestionUseCase,
      this.createStockAlertUseCase,
      this.getStockAlertsUseCase,
      this.createProductReviewUseCase,
      this.getProductReviewsUseCase,
      this.moderateReviewUseCase,
      this.createProductComparisonUseCase,
      this.getProductComparisonUseCase,
      this.updateProductBadgesUseCase,
      this.getPriceHistoryUseCase,
      this.getSearchHistoryUseCase
    );

    this.categoryController = new CategoryController(
      this.createCategoryUseCase,
      this.getCategoryUseCase,
      this.listCategoriesUseCase,
      this.updateCategoryUseCase,
      this.deleteCategoryUseCase
    );

    this.productVariantController = new ProductVariantController(
      this.createProductVariantUseCase,
      this.getProductVariantUseCase,
      this.updateProductVariantUseCase,
      this.deleteProductVariantUseCase
    );

    this.productImageController = new ProductImageController(
      this.createProductImageUseCase,
      this.getProductImageUseCase,
      this.updateProductImageUseCase,
      this.deleteProductImageUseCase,
      this.setPrimaryImageUseCase
    );

    this.productTagController = new ProductTagController(
      this.createProductTagUseCase,
      this.getProductTagUseCase,
      this.deleteProductTagUseCase
    );

    this.productInventoryController = new ProductInventoryController(
      this.createProductInventoryUseCase,
      this.getProductInventoryUseCase,
      this.reserveInventoryUseCase,
      this.releaseInventoryUseCase,
      this.adjustInventoryUseCase
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

  public getProductController(): ProductController {
    return this.productController;
  }

  public getCategoryController(): CategoryController {
    return this.categoryController;
  }

  public getProductVariantController(): ProductVariantController {
    return this.productVariantController;
  }

  public getProductImageController(): ProductImageController {
    return this.productImageController;
  }

  public getProductTagController(): ProductTagController {
    return this.productTagController;
  }

  public getProductInventoryController(): ProductInventoryController {
    return this.productInventoryController;
  }

  public async dispose(): Promise<void> {
    await this.prisma.$disconnect();
    logger.info('Container disposed');
  }
}

