import { Request, Response } from 'express';
import { CreateProductUseCase } from '../../core/use-cases/CreateProductUseCase';
import { GetProductUseCase } from '../../core/use-cases/GetProductUseCase';
import { ListProductsUseCase } from '../../core/use-cases/ListProductsUseCase';
import { UpdateProductUseCase } from '../../core/use-cases/UpdateProductUseCase';
import { DeleteProductUseCase } from '../../core/use-cases/DeleteProductUseCase';
import { SearchProductsUseCase } from '../../core/use-cases/SearchProductsUseCase';
import { GetProductRecommendationsUseCase } from '../../core/use-cases/GetProductRecommendationsUseCase';
import { TrackProductViewUseCase } from '../../core/use-cases/TrackProductViewUseCase';
import { CreateProductQuestionUseCase } from '../../core/use-cases/CreateProductQuestionUseCase';
import { GetProductQuestionsUseCase } from '../../core/use-cases/GetProductQuestionsUseCase';
import { AnswerProductQuestionUseCase } from '../../core/use-cases/AnswerProductQuestionUseCase';
import { CreateStockAlertUseCase } from '../../core/use-cases/CreateStockAlertUseCase';
import { GetStockAlertsUseCase } from '../../core/use-cases/GetStockAlertsUseCase';
import { CreateProductReviewUseCase } from '../../core/use-cases/CreateProductReviewUseCase';
import { GetProductReviewsUseCase } from '../../core/use-cases/GetProductReviewsUseCase';
import { ModerateReviewUseCase } from '../../core/use-cases/ModerateReviewUseCase';
import { CreateProductComparisonUseCase } from '../../core/use-cases/CreateProductComparisonUseCase';
import { GetProductComparisonUseCase } from '../../core/use-cases/GetProductComparisonUseCase';
import { UpdateProductBadgesUseCase } from '../../core/use-cases/UpdateProductBadgesUseCase';
import { GetPriceHistoryUseCase } from '../../core/use-cases/PriceHistoryUseCases';
import { GetSearchHistoryUseCase } from '../../core/use-cases/ProductSearchHistoryUseCases';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendNotFound,
} from '../utils/response.util';

export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly searchProductsUseCase: SearchProductsUseCase,
    private readonly getProductRecommendationsUseCase: GetProductRecommendationsUseCase,
    private readonly trackProductViewUseCase: TrackProductViewUseCase,
    private readonly createProductQuestionUseCase: CreateProductQuestionUseCase,
    private readonly getProductQuestionsUseCase: GetProductQuestionsUseCase,
    private readonly answerProductQuestionUseCase: AnswerProductQuestionUseCase,
    private readonly createStockAlertUseCase: CreateStockAlertUseCase,
    private readonly getStockAlertsUseCase: GetStockAlertsUseCase,
    private readonly createProductReviewUseCase: CreateProductReviewUseCase,
    private readonly getProductReviewsUseCase: GetProductReviewsUseCase,
    private readonly moderateReviewUseCase: ModerateReviewUseCase,
    private readonly createProductComparisonUseCase: CreateProductComparisonUseCase,
    private readonly getProductComparisonUseCase: GetProductComparisonUseCase,
    private readonly updateProductBadgesUseCase: UpdateProductBadgesUseCase,
    private readonly getPriceHistoryUseCase: GetPriceHistoryUseCase,
    private readonly getSearchHistoryUseCase: GetSearchHistoryUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const product = await this.createProductUseCase.execute(req.body);
      sendCreated(res, 'Product created successfully', product);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          sendBadRequest(res, error.message);
        } else {
          sendBadRequest(res, 'Failed to create product', error.message);
        }
      } else {
        sendBadRequest(res, 'Failed to create product');
      }
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const product = await this.getProductUseCase.execute(req.params.id);
      sendSuccess(res, 'Product retrieved successfully', product);
    } catch (error) {
      if (error instanceof Error && error.message === 'Product not found') {
        sendNotFound(res, error.message);
      } else {
        sendBadRequest(res, 'Failed to retrieve product', error instanceof Error ? error.message : undefined);
      }
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        status: req.query.status as string | undefined,
        isVisible: req.query.isVisible === 'true' ? true : req.query.isVisible === 'false' ? false : undefined,
        categoryId: req.query.categoryId as string | undefined,
        search: req.query.search as string | undefined,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        inStock: req.query.inStock === 'true' ? true : req.query.inStock === 'false' ? false : undefined,
        badges: req.query.badges ? (req.query.badges as string).split(',') : undefined,
        sortBy: req.query.sortBy as 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popularity' | 'name' | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };

      const result = await this.listProductsUseCase.execute(filters);
      sendSuccess(res, 'Products retrieved successfully', result);
    } catch (error) {
      sendBadRequest(res, 'Failed to retrieve products', error instanceof Error ? error.message : undefined);
    }
  }

  async search(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;
      if (!query) {
        sendBadRequest(res, 'Search query is required');
        return;
      }

      const filters = {
        categoryId: req.query.categoryId as string | undefined,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        inStock: req.query.inStock === 'true' ? true : undefined,
        badges: req.query.badges ? (req.query.badges as string).split(',') : undefined,
        sortBy: req.query.sortBy as 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popularity' | 'relevance' | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };

      const result = await this.searchProductsUseCase.execute(query, filters);
      sendSuccess(res, 'Search completed successfully', result);
    } catch (error) {
      sendBadRequest(res, 'Failed to search products', error instanceof Error ? error.message : undefined);
    }
  }

  async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const productId = req.params.id;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const recommendations = await this.getProductRecommendationsUseCase.execute(productId, limit);
      sendSuccess(res, 'Recommendations retrieved successfully', { recommendations });
    } catch (error) {
      sendBadRequest(res, 'Failed to get recommendations', error instanceof Error ? error.message : undefined);
    }
  }

  async trackView(req: Request, res: Response): Promise<void> {
    try {
      const productId = req.params.id;
      await this.trackProductViewUseCase.execute(productId);
      sendSuccess(res, 'Product view tracked successfully', undefined);
    } catch (error) {
      sendBadRequest(res, 'Failed to track product view', error instanceof Error ? error.message : undefined);
    }
  }

  async createQuestion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const productId = req.params.id;
      const { question } = req.body;

      if (!question) {
        sendBadRequest(res, 'Question is required');
        return;
      }

      const productQuestion = await this.createProductQuestionUseCase.execute({
        productId,
        userId: req.user?.userId,
        question,
      });

      sendCreated(res, 'Question submitted successfully', productQuestion);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Product not found' || error.message === 'Product is not available') {
          sendNotFound(res, error.message);
        } else {
          sendBadRequest(res, error.message);
        }
      } else {
        sendBadRequest(res, 'Failed to create question');
      }
    }
  }

  async getQuestions(req: Request, res: Response): Promise<void> {
    try {
      const productId = req.params.id;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const offset = req.query.offset ? Number(req.query.offset) : 0;
      const isApproved = req.query.isApproved === 'true' ? true : req.query.isApproved === 'false' ? false : undefined;
      const answered = req.query.answered === 'true' ? true : req.query.answered === 'false' ? false : undefined;

      const result = await this.getProductQuestionsUseCase.execute(productId, {
        limit,
        offset,
        isApproved,
        answered,
      });

      sendSuccess(res, 'Questions retrieved successfully', result);
    } catch (error) {
      sendBadRequest(res, 'Failed to get questions', error instanceof Error ? error.message : undefined);
    }
  }

  async answerQuestion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const questionId = req.params.questionId;
      const { answer } = req.body;

      if (!answer) {
        sendBadRequest(res, 'Answer is required');
        return;
      }

      if (!req.user?.userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const productQuestion = await this.answerProductQuestionUseCase.execute(questionId, {
        answer,
        answeredBy: req.user.userId,
      });

      sendSuccess(res, 'Question answered successfully', productQuestion);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Question not found') {
          sendNotFound(res, error.message);
        } else {
          sendBadRequest(res, error.message);
        }
      } else {
        sendBadRequest(res, 'Failed to answer question');
      }
    }
  }

  async createStockAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const productId = req.params.id;
      const { email, variantId } = req.body;

      if (!email) {
        sendBadRequest(res, 'Email is required');
        return;
      }

      if (!req.user?.userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const alert = await this.createStockAlertUseCase.execute({
        productId,
        userId: req.user.userId,
        email,
        variantId,
      });

      sendCreated(res, 'Stock alert created successfully', alert);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Product not found') {
          sendNotFound(res, error.message);
        } else if (error.message.includes('already exists') || error.message.includes('already in stock')) {
          sendBadRequest(res, error.message);
        } else {
          sendBadRequest(res, error.message);
        }
      } else {
        sendBadRequest(res, 'Failed to create stock alert');
      }
    }
  }

  async getStockAlerts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const alerts = await this.getStockAlertsUseCase.execute(req.user.userId);
      sendSuccess(res, 'Stock alerts retrieved successfully', { alerts });
    } catch (error) {
      sendBadRequest(res, 'Failed to get stock alerts', error instanceof Error ? error.message : undefined);
    }
  }

  async createReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const productId = req.params.id;
      const { rating, title, comment, isVerifiedPurchase } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        sendBadRequest(res, 'Rating must be between 1 and 5');
        return;
      }

      if (!req.user?.userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const review = await this.createProductReviewUseCase.execute({
        productId,
        userId: req.user.userId,
        rating,
        title,
        comment,
        isVerifiedPurchase,
      });

      sendCreated(res, 'Review submitted successfully (pending moderation)', review);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Product not found' || error.message === 'Product is not available') {
          sendNotFound(res, error.message);
        } else {
          sendBadRequest(res, error.message);
        }
      } else {
        sendBadRequest(res, 'Failed to create review');
      }
    }
  }

  async getReviews(req: Request, res: Response): Promise<void> {
    try {
      const productId = req.params.id;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const offset = req.query.offset ? Number(req.query.offset) : 0;
      const isApproved = req.query.isApproved === 'true' ? true : req.query.isApproved === 'false' ? false : true; // Default to approved
      const rating = req.query.rating ? Number(req.query.rating) : undefined;
      const sortBy = req.query.sortBy as 'newest' | 'oldest' | 'rating' | 'helpful' | undefined;

      const result = await this.getProductReviewsUseCase.execute(productId, {
        limit,
        offset,
        isApproved,
        rating,
        sortBy,
      });

      sendSuccess(res, 'Reviews retrieved successfully', result);
    } catch (error) {
      sendBadRequest(res, 'Failed to get reviews', error instanceof Error ? error.message : undefined);
    }
  }

  async moderateReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const { action } = req.body; // 'approve' or 'reject'

      if (!req.user?.roles?.includes('admin')) {
        sendBadRequest(res, 'Admin access required');
        return;
      }

      if (action === 'approve') {
        await this.moderateReviewUseCase.approve(reviewId);
        sendSuccess(res, 'Review approved successfully', undefined);
      } else if (action === 'reject') {
        await this.moderateReviewUseCase.reject(reviewId);
        sendSuccess(res, 'Review rejected successfully', undefined);
      } else {
        sendBadRequest(res, 'Invalid action. Use "approve" or "reject"');
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Review not found') {
          sendNotFound(res, error.message);
        } else {
          sendBadRequest(res, error.message);
        }
      } else {
        sendBadRequest(res, 'Failed to moderate review');
      }
    }
  }

  async getPendingReviews(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.roles?.includes('admin')) {
        sendBadRequest(res, 'Admin access required');
        return;
      }

      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const reviews = await this.moderateReviewUseCase.getPendingReviews(limit);

      sendSuccess(res, 'Pending reviews retrieved successfully', { reviews });
    } catch (error) {
      sendBadRequest(res, 'Failed to get pending reviews', error instanceof Error ? error.message : undefined);
    }
  }

  async createComparison(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { productIds, name } = req.body;

      if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
        sendBadRequest(res, 'At least 2 product IDs are required');
        return;
      }

      if (!req.user?.userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const comparison = await this.createProductComparisonUseCase.execute({
        userId: req.user.userId,
        productIds,
        name,
      });

      sendCreated(res, 'Product comparison created successfully', comparison);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('not available')) {
          sendNotFound(res, error.message);
        } else {
          sendBadRequest(res, error.message);
        }
      } else {
        sendBadRequest(res, 'Failed to create comparison');
      }
    }
  }

  async getComparison(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { comparisonId } = req.params;

      const result = await this.getProductComparisonUseCase.execute(comparisonId);
      sendSuccess(res, 'Comparison retrieved successfully', result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Comparison not found') {
          sendNotFound(res, error.message);
        } else {
          sendBadRequest(res, error.message);
        }
      } else {
        sendBadRequest(res, 'Failed to get comparison');
      }
    }
  }

  async getUserComparisons(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const comparisons = await this.getProductComparisonUseCase.executeByUserId(req.user.userId);
      sendSuccess(res, 'Comparisons retrieved successfully', { comparisons });
    } catch (error) {
      sendBadRequest(res, 'Failed to get comparisons', error instanceof Error ? error.message : undefined);
    }
  }

  async updateBadges(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.roles?.includes('admin')) {
        sendBadRequest(res, 'Admin access required');
        return;
      }

      const productId = req.params.id;
      const { action, badge, badges } = req.body;

      if (action === 'add' && badge) {
        const product = await this.updateProductBadgesUseCase.addBadge(productId, badge);
        sendSuccess(res, 'Badge added successfully', product);
      } else if (action === 'remove' && badge) {
        const product = await this.updateProductBadgesUseCase.removeBadge(productId, badge);
        sendSuccess(res, 'Badge removed successfully', product);
      } else if (action === 'set' && badges) {
        const product = await this.updateProductBadgesUseCase.setBadges(productId, badges);
        sendSuccess(res, 'Badges updated successfully', product);
      } else {
        sendBadRequest(res, 'Invalid action. Use "add", "remove", or "set" with appropriate parameters');
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Product not found') {
          sendNotFound(res, error.message);
        } else {
          sendBadRequest(res, error.message);
        }
      } else {
        sendBadRequest(res, 'Failed to update badges');
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const product = await this.updateProductUseCase.execute(req.params.id, req.body);
      sendSuccess(res, 'Product updated successfully', product);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Product not found') {
          sendNotFound(res, error.message);
        } else if (error.message.includes('already exists')) {
          sendBadRequest(res, error.message);
        } else {
          sendBadRequest(res, 'Failed to update product', error.message);
        }
      } else {
        sendBadRequest(res, 'Failed to update product');
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await this.deleteProductUseCase.execute(req.params.id);
      sendSuccess(res, 'Product deleted successfully', undefined);
    } catch (error) {
      if (error instanceof Error && error.message === 'Product not found') {
        sendNotFound(res, error.message);
      } else {
        sendBadRequest(res, 'Failed to delete product', error instanceof Error ? error.message : undefined);
      }
    }
  }

  async getPriceHistory(req: Request, res: Response): Promise<void> {
    try {
      const productId = req.params.id;
      const limit = req.query.limit ? Number(req.query.limit) : 50;

      const history = await this.getPriceHistoryUseCase.execute(productId, limit);
      sendSuccess(res, 'Price history retrieved successfully', { history });
    } catch (error: any) {
      sendBadRequest(res, error.message || 'Failed to retrieve price history');
    }
  }

  async getSearchHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId;
      const limit = req.query.limit ? Number(req.query.limit) : 50;

      if (userId) {
        const history = await this.getSearchHistoryUseCase.executeByUserId(userId, limit);
        sendSuccess(res, 'Search history retrieved successfully', { history });
      } else {
        const popular = await this.getSearchHistoryUseCase.executePopularQueries(limit);
        sendSuccess(res, 'Popular searches retrieved successfully', { queries: popular });
      }
    } catch (error: any) {
      sendBadRequest(res, error.message || 'Failed to retrieve search history');
    }
  }

  async getPopularSearches(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const popular = await this.getSearchHistoryUseCase.executePopularQueries(limit);
      sendSuccess(res, 'Popular searches retrieved successfully', { queries: popular });
    } catch (error: any) {
      sendBadRequest(res, error.message || 'Failed to retrieve popular searches');
    }
  }
}

