import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, Message } from '@aws-sdk/client-sqs';
import { IEventConsumer } from '../../ports/interfaces/IEventConsumer';
import { getEnvConfig } from '../../config/env';
import { createLogger } from '../logging/logger';

const logger = createLogger();

type EventHandler = (event: Record<string, unknown>) => Promise<void>;

export class SQSEventConsumer implements IEventConsumer {
  private sqsClient: SQSClient;
  private config = getEnvConfig();
  private isLocalStack: boolean;
  private handlers: Map<string, EventHandler[]> = new Map();
  private isRunning: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor() {
    const localstackEndpoint = process.env.LOCALSTACK_ENDPOINT;
    this.isLocalStack = !!localstackEndpoint;

    const clientConfig: any = {
      region: this.config.AWS_REGION,
    };

    if (this.isLocalStack) {
      clientConfig.endpoint = localstackEndpoint;
      clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'localstack',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'localstack',
      };
      logger.info('Using LocalStack for SQS (development)', { endpoint: localstackEndpoint });
    } else {
      logger.info('Using AWS SQS', { region: this.config.AWS_REGION });
    }

    this.sqsClient = new SQSClient(clientConfig);
  }

  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
    logger.info('Subscribed to event topic', { eventType });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Event consumer is already running');
      return;
    }

    if (!this.config.SQS_QUEUE_URL) {
      logger.warn('SQS_QUEUE_URL not configured, event consumer not started (using mock mode)');
      return;
    }

    if (this.config.EVENT_CONSUMER_TYPE === 'mock') {
      logger.info('Event consumer in mock mode, not starting SQS polling');
      return;
    }

    this.isRunning = true;
    logger.info('Starting SQS event consumer', { queueUrl: this.config.SQS_QUEUE_URL });

    // Start polling for messages
    this.pollMessages();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    logger.info('SQS event consumer stopped');
  }

  isRunning(): boolean {
    return this.isRunning;
  }

  private async pollMessages(): Promise<void> {
    if (!this.isRunning || !this.config.SQS_QUEUE_URL) {
      return;
    }

    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.config.SQS_QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20, // Long polling
        VisibilityTimeout: 60,
        MessageAttributeNames: ['All'],
      });

      const result = await this.sqsClient.send(command);

      if (result.Messages && result.Messages.length > 0) {
        for (const message of result.Messages) {
          await this.processMessage(message);
        }
      }

      // Continue polling
      this.pollMessages();
    } catch (error) {
      logger.error('Error polling SQS messages', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      // Retry after delay
      setTimeout(() => this.pollMessages(), 5000);
    }
  }

  private async processMessage(message: Message): Promise<void> {
    if (!message.Body || !message.ReceiptHandle) {
      return;
    }

    try {
      const snsMessage = JSON.parse(message.Body);
      
      // Extract event from SNS message
      let eventData: Record<string, unknown>;
      let eventType: string | undefined;

      if (snsMessage.Type === 'Notification') {
        // Message from SNS
        eventData = JSON.parse(snsMessage.Message);
        eventType = snsMessage.Subject || 
                    snsMessage.MessageAttributes?.eventType?.Value ||
                    snsMessage.MessageAttributes?.EventType?.Value;
      } else {
        // Direct event
        eventData = snsMessage;
        eventType = snsMessage.eventType || snsMessage.type;
      }

      if (eventType && this.handlers.has(eventType)) {
        const handlers = this.handlers.get(eventType)!;
        for (const handler of handlers) {
          try {
            await handler(eventData);
          } catch (handlerError) {
            logger.error('Error in event handler', {
              eventType,
              error: handlerError instanceof Error ? handlerError.message : 'Unknown error',
            });
            // Continue processing other handlers even if one fails
          }
        }
      } else {
        logger.warn('No handler found for event type', { eventType });
      }

      // Delete message from queue after processing
      if (this.config.SQS_QUEUE_URL && message.ReceiptHandle) {
        const deleteCommand = new DeleteMessageCommand({
          QueueUrl: this.config.SQS_QUEUE_URL,
          ReceiptHandle: message.ReceiptHandle,
        });
        await this.sqsClient.send(deleteCommand);
      }

      logger.info('Event processed successfully', { messageId: message.MessageId, eventType });
    } catch (error) {
      logger.error('Error processing message', { 
        messageId: message.MessageId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      // In production, you might want to send to dead letter queue
      // For now, we'll just log the error and continue
    }
  }
}

