import { IEventConsumer } from '../../ports/interfaces/IEventConsumer';
import { MockEventConsumer } from './MockEventConsumer';
import { SQSEventConsumer } from './SQSEventConsumer';
import { getEnvConfig } from '../../config/env';

export function createEventConsumer(): IEventConsumer {
  const config = getEnvConfig();
  const consumerType = config.EVENT_CONSUMER_TYPE || (process.env.LOCALSTACK_ENDPOINT ? 'sqs' : 'mock');

  if (consumerType === 'sqs') {
    return new SQSEventConsumer();
  }

  return new MockEventConsumer();
}

