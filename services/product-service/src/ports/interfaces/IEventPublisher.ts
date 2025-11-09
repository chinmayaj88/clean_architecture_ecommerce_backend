export interface IEventPublisher {
  publish(topic: string, event: Record<string, unknown>): Promise<void>;
}

export interface ProductCreatedEvent extends Record<string, unknown> {
  productId: string;
  sku: string;
  name: string;
  price: number;
  status: string;
  timestamp: string;
  source: 'product-service';
}

export interface ProductUpdatedEvent extends Record<string, unknown> {
  productId: string;
  sku: string;
  name?: string;
  price?: number;
  status?: string;
  timestamp: string;
  source: 'product-service';
}

export interface ProductDeletedEvent extends Record<string, unknown> {
  productId: string;
  sku: string;
  timestamp: string;
  source: 'product-service';
}

export interface ProductPriceChangedEvent extends Record<string, unknown> {
  productId: string;
  sku: string;
  oldPrice: number;
  newPrice: number;
  timestamp: string;
  source: 'product-service';
}

export interface ProductStockChangedEvent extends Record<string, unknown> {
  productId: string;
  sku: string;
  oldStock: number;
  newStock: number;
  timestamp: string;
  source: 'product-service';
}

