import { SNSClient, PublishCommand, CreateTopicCommand } from '@aws-sdk/client-sns';
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
      region: this.config.AWS_REGION || 'us-east-1',
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
      const topicArn = this.config.SNS_TOPIC_ARN || `arn:aws:sns:${this.config.AWS_REGION || 'us-east-1'}:000000000000:${topic}`;
      
      const command = new PublishCommand({
        TopicArn: topicArn,
        Message: JSON.stringify(event),
        MessageAttributes: {
          eventType: {
            DataType: 'String',
            StringValue: topic,
          },
          source: {
            DataType: 'String',
            StringValue: (event.source as string) || 'order-service',
          },
        },
      });

      await this.snsClient.send(command);
      logger.debug('Event published successfully', { topic, orderId: (event as any).orderId || event.id });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as any)?.name || (error as any)?.code;
      
      if (
        process.env.LOCALSTACK_ENDPOINT &&
        error instanceof Error &&
        (errorMessage.includes('does not exist') ||
          errorMessage.includes('NotFound') ||
          errorCode === 'NotFound')
      ) {
        logger.info('Topic does not exist, creating it', { topic });
        try {
          const createCommand = new CreateTopicCommand({ Name: topic });
          const createResult = await this.snsClient.send(createCommand);

          if (createResult.TopicArn) {
            const publishCommand = new PublishCommand({
              TopicArn: createResult.TopicArn,
              Message: JSON.stringify(event),
              MessageAttributes: {
                eventType: {
                  DataType: 'String',
                  StringValue: topic,
                },
                source: {
                  DataType: 'String',
                  StringValue: (event.source as string) || 'order-service',
                },
              },
            });

            await this.snsClient.send(publishCommand);

            logger.info('Topic created and event published', {
              topic,
              topicArn: createResult.TopicArn,
            });
          }
        } catch (createError) {
          logger.error('Failed to create topic', {
            topic,
            error: createError instanceof Error ? createError.message : String(createError),
          });
          // Don't throw - event publishing should be fire and forget
        }
      } else {
        logger.error('Failed to publish event', {
          topic,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Don't throw - event publishing should be fire and forget
      }
    }
  }
}

