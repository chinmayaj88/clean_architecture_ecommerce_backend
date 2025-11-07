/**
 * Get Product Questions Use Case
 */

import { IProductQuestionRepository } from '../../ports/interfaces/IProductQuestionRepository';
import { ProductQuestion } from '../../core/entities/ProductQuestion';

export class GetProductQuestionsUseCase {
  constructor(private readonly productQuestionRepository: IProductQuestionRepository) {}

  async execute(
    productId: string,
    options?: {
      limit?: number;
      offset?: number;
      isApproved?: boolean;
      answered?: boolean;
    }
  ): Promise<{ questions: ProductQuestion[]; total: number }> {
    const [questions, total] = await Promise.all([
      this.productQuestionRepository.findByProductId(productId, options),
      this.productQuestionRepository.countByProductId(productId, {
        isApproved: options?.isApproved,
        answered: options?.answered,
      }),
    ]);

    return { questions, total };
  }
}

