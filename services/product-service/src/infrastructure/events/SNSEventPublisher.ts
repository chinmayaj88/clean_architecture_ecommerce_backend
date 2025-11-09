import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { IEventPublisher } from '../../ports/interfaces/IEventPublisher';
import { getEnvConfig } from '../../config/env';
import { createLogger } from '../logging/logger';

const logger = createLogger();

export class SNSEventPublisher implements IEventPublisher {
  private snsClient: SNSClient;
  private config = getEnvConfig();

  constructor() {
    const localstackEndpoint = process.env.LOCALSTACK_ENDPOINT;
    const isLocalStack = !!localstackEndpoint;

    const clientConfig: any = {
      region: this.config.AWS_REGION,
    };

    if (isLocalStack) {
      clientConfig.endpoint = localstackEndpoint;
      clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'localstack',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'localstack',
      };
      logger.info('Using LocalStack for SNS (development)', { endpoint: localstackEndpoint });
    }

    this.snsClient = new SNSClient(clientConfig);
  }

  async publish(topic: string, event: Record<string, unknown>): Promise<void> {
    try {
      const topicArn = this.config.SNS_TOPIC_ARN || `arn:aws:sns:${this.config.AWS_REGION}:000000000000:${topic}`;
      
      const command = new PublishCommand({
        TopicArn: topicArn,
        Message: JSON.stringify(event),
        MessageAttributes: {
          eventType: {
            DataType: 'String',
            StringValue: topic,
          },
        },
      });

      await this.snsClient.send(command);
      logger.debug('Event published successfully', { topic, eventId: (event as any).productId || event.id });
    } catch (error) {
      logger.error('Failed to publish event', { topic, error: error instanceof Error ? error.message : 'Unknown error' });
      // Don't throw - event publishing should be fire and forget
    }
  }
}

