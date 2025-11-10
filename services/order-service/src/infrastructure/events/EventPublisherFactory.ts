import { IEventPublisher } from '../../ports/interfaces/IEventPublisher';
import { MockEventPublisher } from './MockEventPublisher';
import { SNSEventPublisher } from './SNSEventPublisher';
import { getEnvConfig } from '../../config/env';

export function createEventPublisher(): IEventPublisher {
  const config = getEnvConfig();
  const publisherType = config.EVENT_PUBLISHER_TYPE || (process.env.LOCALSTACK_ENDPOINT ? 'sns' : 'mock');

  if (publisherType === 'sns') {
    return new SNSEventPublisher();
  }

  return new MockEventPublisher();
}

