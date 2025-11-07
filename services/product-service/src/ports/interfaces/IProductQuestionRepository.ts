/**
 * Product Question Repository Interface
 */

import { ProductQuestion, CreateProductQuestionData, AnswerProductQuestionData } from '../../core/entities/ProductQuestion';

export interface IProductQuestionRepository {
  /**
   * Create a question
   */
  create(data: CreateProductQuestionData): Promise<ProductQuestion>;

  /**
   * Find question by ID
   */
  findById(id: string): Promise<ProductQuestion | null>;

  /**
   * Find questions for a product
   */
  findByProductId(
    productId: string,
    options?: {
      limit?: number;
      offset?: number;
      isApproved?: boolean;
      answered?: boolean;
    }
  ): Promise<ProductQuestion[]>;

  /**
   * Count questions for a product
   */
  countByProductId(
    productId: string,
    filters?: {
      isApproved?: boolean;
      answered?: boolean;
    }
  ): Promise<number>;

  /**
   * Answer a question
   */
  answer(id: string, data: AnswerProductQuestionData): Promise<ProductQuestion>;

  /**
   * Upvote a question
   */
  upvote(id: string): Promise<void>;

  /**
   * Report a question
   */
  report(id: string): Promise<void>;

  /**
   * Approve a question
   */
  approve(id: string): Promise<void>;

  /**
   * Delete a question
   */
  delete(id: string): Promise<void>;
}

