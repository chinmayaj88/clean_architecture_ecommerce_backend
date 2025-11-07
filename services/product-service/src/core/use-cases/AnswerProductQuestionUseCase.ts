/**
 * Answer Product Question Use Case
 */

import { IProductQuestionRepository } from '../../ports/interfaces/IProductQuestionRepository';
import { ProductQuestion, AnswerProductQuestionData } from '../../core/entities/ProductQuestion';

export class AnswerProductQuestionUseCase {
  constructor(private readonly productQuestionRepository: IProductQuestionRepository) {}

  async execute(questionId: string, data: AnswerProductQuestionData): Promise<ProductQuestion> {
    const question = await this.productQuestionRepository.findById(questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    if (question.answer) {
      throw new Error('Question already answered');
    }

    return this.productQuestionRepository.answer(questionId, data);
  }
}

