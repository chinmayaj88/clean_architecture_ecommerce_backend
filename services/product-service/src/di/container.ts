import { PrismaClient } from '@prisma/client';
import { IProductRepository } from '../ports/interfaces/IProductRepository';
import { IProductQuestionRepository } from '../ports/interfaces/IProductQuestionRepository';
import { IStockAlertRepository } from '../ports/interfaces/IStockAlertRepository';
import { IProductReviewRepository } from '../ports/interfaces/IProductReviewRepository';
import { IProductComparisonRepository } from '../ports/interfaces/IProductComparisonRepository';
import { PrismaProductRepository } from '../infrastructure/database/PrismaProductRepository';
import { PrismaProductQuestionRepository } from '../infrastructure/database/PrismaProductQuestionRepository';
import { PrismaStockAlertRepository } from '../infrastructure/database/PrismaStockAlertRepository';
import { PrismaProductReviewRepository } from '../infrastructure/database/PrismaProductReviewRepository';
import { PrismaProductComparisonRepository } from '../infrastructure/database/PrismaProductComparisonRepository';
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
import { ProductController } from '../application/controllers/ProductController';
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
  private productController: ProductController;

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

    this.createProductUseCase = new CreateProductUseCase(this.productRepository);
    this.getProductUseCase = new GetProductUseCase(this.productRepository);
    this.listProductsUseCase = new ListProductsUseCase(this.productRepository);
    this.updateProductUseCase = new UpdateProductUseCase(this.productRepository);
    this.deleteProductUseCase = new DeleteProductUseCase(this.productRepository);
    this.searchProductsUseCase = new SearchProductsUseCase(this.productRepository);
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
      this.updateProductBadgesUseCase
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

  public async dispose(): Promise<void> {
    await this.prisma.$disconnect();
    logger.info('Container disposed');
  }
}

