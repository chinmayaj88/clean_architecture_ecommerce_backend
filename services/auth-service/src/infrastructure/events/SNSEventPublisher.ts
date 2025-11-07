import { SNSClient, PublishCommand, CreateTopicCommand } from '@aws-sdk/client-sns';
import { IEventPublisher } from '../../ports/interfaces/IEventPublisher';
import { getEnvConfig } from '../../config/env';
import { getEnvironmentConfig } from '../../config/environment';
import { createLogger } from '../logging/logger';

const logger = createLogger();

export class SNSEventPublisher implements IEventPublisher {
  private snsClient: SNSClient;
  private config = getEnvConfig();
  private envConfig = getEnvironmentConfig();
  private isLocalStack: boolean;
  private isStaging: boolean;

  constructor() {
    const localstackEndpoint = process.env.LOCALSTACK_ENDPOINT;
    this.isLocalStack = !!localstackEndpoint;
    this.isStaging = this.envConfig.isStaging();

    const clientConfig: any = {
      region: this.config.AWS_REGION,
    };

    if (this.isLocalStack) {
      clientConfig.endpoint = localstackEndpoint;
      clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'localstack',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'localstack',
      };
      logger.info('Using LocalStack for SNS (development)', {
        endpoint: localstackEndpoint,
      });
    } else if (this.isStaging) {
      logger.info('Using minimal AWS SNS (staging)', {
        region: this.config.AWS_REGION,
      });
    } else {
      logger.info('Using full AWS SNS (production)', {
        region: this.config.AWS_REGION,
      });
    }

    this.snsClient = new SNSClient(clientConfig);
  }

  async publish(topic: string, event: Record<string, unknown>): Promise<void> {
    try {
      const accountId = this.isLocalStack
        ? '000000000000'
        : process.env.AWS_ACCOUNT_ID || '000000000000';

      const topicArn = `arn:aws:sns:${this.config.AWS_REGION}:${accountId}:${topic}`;

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
            StringValue: (event.source as string) || 'auth-service',
          },
        },
      });

      await this.snsClient.send(command);

      logger.info('Event published successfully', {
        topic,
        topicArn,
        isLocalStack: this.isLocalStack,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as any)?.name || (error as any)?.code;
      
      if (
        this.isLocalStack &&
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
                  StringValue: (event.source as string) || 'auth-service',
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
          throw createError;
        }
      } else {
        logger.error('Failed to publish event', {
          topic,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }
  }
}
