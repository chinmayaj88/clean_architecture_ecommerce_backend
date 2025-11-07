/**
 * Update Product Badges Use Case
 * Manages product badges (new, sale, featured, bestseller)
 */

import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { Product } from '../../core/entities/Product';

export type ProductBadge = 'new' | 'sale' | 'featured' | 'bestseller' | 'trending';

export class UpdateProductBadgesUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async addBadge(productId: string, badge: ProductBadge): Promise<Product> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const currentBadges = product.badges || [];
    if (!currentBadges.includes(badge)) {
      const updatedBadges = [...currentBadges, badge];
      return this.productRepository.update(productId, {
        ...product,
        badges: updatedBadges,
      } as any);
    }

    return product;
  }

  async removeBadge(productId: string, badge: ProductBadge): Promise<Product> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const currentBadges = product.badges || [];
    const updatedBadges = currentBadges.filter((b: string) => b !== badge);

    return this.productRepository.update(productId, {
      ...product,
      badges: updatedBadges,
    } as any);
  }

  async setBadges(productId: string, badges: ProductBadge[]): Promise<Product> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    return this.productRepository.update(productId, {
      ...product,
      badges,
    } as any);
  }
}

