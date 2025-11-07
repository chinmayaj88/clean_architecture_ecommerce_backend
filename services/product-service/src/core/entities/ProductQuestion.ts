/**
 * Product Question Entity
 * Q&A for products
 */

export interface ProductQuestion {
  id: string;
  productId: string;
  userId?: string | null;
  question: string;
  answer?: string | null;
  answeredBy?: string | null;
  answeredAt?: Date | null;
  upvotes: number;
  isApproved: boolean;
  reportedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductQuestionData {
  productId: string;
  userId?: string;
  question: string;
}

export interface AnswerProductQuestionData {
  answer: string;
  answeredBy: string;
}

