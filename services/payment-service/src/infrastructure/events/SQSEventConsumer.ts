import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, GetQueueUrlCommand } from '@aws-sdk/client-sqs';
import { IEventConsumer, OrderCreatedEvent, OrderCancelledEvent } from '../../ports/interfaces/IEventConsumer';
import { getEnvConfig } from '../../config/env';
import { createLogger } from '../logging/logger';

const logger = createLogger();

export class SQSEventConsumer implements IEventConsumer {
  private sqsClient: SQSClient;
  private config = getEnvConfig();
  private orderCreatedHandlers: Array<(event: OrderCreatedEvent) => Promise<void>> = [];
  private orderCancelledHandlers: Array<(event: OrderCancelledEvent) => Promise<void>> = [];
  private isRunning = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor() {
    const localstackEndpoint = process.env.LOCALSTACK_ENDPOINT;
    const isLocalStack = !!localstackEndpoint;

    const clientConfig: any = {
      region: this.config.AWS_REGION || 'us-east-1',
    };

    if (isLocalStack) {
      clientConfig.endpoint = localstackEndpoint;
      clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'localstack',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'localstack',
      };
      logger.info('Using LocalStack for SQS (development)', { endpoint: localstackEndpoint });
    }

    this.sqsClient = new SQSClient(clientConfig);
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Event consumer is already running');
      return;
    }

    this.isRunning = true;
    logger.info('SQS event consumer started');

    // Start polling for messages
    this.poll();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
      this.pollingInterval = null;
    }
    logger.info('SQS event consumer stopped');
  }

  onOrderCreated(handler: (event: OrderCreatedEvent) => Promise<void>): void {
    this.orderCreatedHandlers.push(handler);
    logger.info('Order created handler registered');
  }

  onOrderCancelled(handler: (event: OrderCancelledEvent) => Promise<void>): void {
    this.orderCancelledHandlers.push(handler);
    logger.info('Order cancelled handler registered');
  }

  private async poll(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      const queueUrl = this.config.SQS_QUEUE_URL || await this.getQueueUrl();
      
      if (!queueUrl) {
        logger.warn('Queue URL not found, retrying in 5 seconds');
        this.pollingInterval = setTimeout(() => this.poll(), 5000);
        return;
      }

      const command = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20, // Long polling
      });

      const response = await this.sqsClient.send(command);

      if (response.Messages && response.Messages.length > 0) {
        for (const message of response.Messages) {
          if (message.Body && message.ReceiptHandle) {
            try {
              await this.processMessage(message.Body, message.ReceiptHandle, queueUrl);
            } catch (error) {
              logger.error('Error processing message', { error });
            }
          }
        }
      }

      // Continue polling
      this.pollingInterval = setTimeout(() => this.poll(), 1000);
    } catch (error) {
      logger.error('Error polling for messages', { error });
      // Retry after delay
      this.pollingInterval = setTimeout(() => this.poll(), 5000);
    }
  }

  private async processMessage(body: string, receiptHandle: string, queueUrl: string): Promise<void> {
    try {
      const event = JSON.parse(body);
      const eventType = event.eventType || event.type || event['detail-type'];

      if (eventType === 'order.created') {
        const orderCreatedEvent: OrderCreatedEvent = {
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          userId: event.userId,
          totalAmount: event.totalAmount,
          currency: event.currency,
          paymentMethodId: event.paymentMethodId,
          timestamp: event.timestamp,
          source: event.source,
        };

        for (const handler of this.orderCreatedHandlers) {
          try {
            await handler(orderCreatedEvent);
          } catch (error) {
            logger.error('Error handling order.created event', { error });
          }
        }
      } else if (eventType === 'order.cancelled') {
        const orderCancelledEvent: OrderCancelledEvent = {
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          userId: event.userId,
          timestamp: event.timestamp,
          source: event.source,
        };

        for (const handler of this.orderCancelledHandlers) {
          try {
            await handler(orderCancelledEvent);
          } catch (error) {
            logger.error('Error handling order.cancelled event', { error });
          }
        }
      } else {
        logger.warn('Unknown event type', { eventType });
      }

      // Delete message after successful processing
      await this.deleteMessage(queueUrl, receiptHandle);
    } catch (error) {
      logger.error('Error parsing message', { error, body });
      // Delete message even on error to prevent infinite retries
      await this.deleteMessage(queueUrl, receiptHandle);
    }
  }

  private async deleteMessage(queueUrl: string, receiptHandle: string): Promise<void> {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      });
      await this.sqsClient.send(command);
    } catch (error) {
      logger.error('Error deleting message', { error });
    }
  }

  private async getQueueUrl(): Promise<string | null> {
    try {
      // Try to get queue URL from queue name
      const queueName = process.env.SQS_QUEUE_NAME || 'payment-service-queue';
      const command = new GetQueueUrlCommand({ QueueName: queueName });
      const response = await this.sqsClient.send(command);
      return response.QueueUrl || null;
    } catch (error) {
      logger.warn('Could not get queue URL', { error });
      return null;
    }
  }
}

