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
  private _isRunning: boolean = false;
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
    if (this._isRunning) {
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

    this._isRunning = true;
    logger.info('Starting SQS event consumer', { queueUrl: this.config.SQS_QUEUE_URL });

    this.pollMessages();
  }

  async stop(): Promise<void> {
    this._isRunning = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    logger.info('SQS event consumer stopped');
  }

  isRunning(): boolean {
    return this._isRunning;
  }

  private async pollMessages(): Promise<void> {
    while (this._isRunning) {
      try {
        const command = new ReceiveMessageCommand({
          QueueUrl: this.config.SQS_QUEUE_URL,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20,
          MessageAttributeNames: ['All'],
        });

        const response = await this.sqsClient.send(command);

        if (response.Messages && response.Messages.length > 0) {
          await Promise.all(
            response.Messages.map(message => this.processMessage(message))
          );
        }
      } catch (error) {
        logger.error('Error polling SQS messages', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  private async processMessage(message: Message): Promise<void> {
    try {
      if (!message.Body) {
        logger.warn('Received message with no body');
        return;
      }

      const event = JSON.parse(message.Body);
      const eventType = event.eventType || event.type || message.MessageAttributes?.eventType?.StringValue;

      if (!eventType) {
        logger.warn('Received message with no event type', { messageId: message.MessageId });
        return;
      }

      const eventHandlers = this.handlers.get(eventType);
      if (!eventHandlers || eventHandlers.length === 0) {
        logger.debug('No handlers registered for event type', { eventType });
        return;
      }

      await Promise.all(
        eventHandlers.map(handler => handler(event))
      );

      if (message.ReceiptHandle) {
        await this.sqsClient.send(
          new DeleteMessageCommand({
            QueueUrl: this.config.SQS_QUEUE_URL!,
            ReceiptHandle: message.ReceiptHandle,
          })
        );
      }

      logger.debug('Message processed successfully', { eventType, messageId: message.MessageId });
    } catch (error) {
      logger.error('Error processing message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: message.MessageId,
      });
    }
  }
}

