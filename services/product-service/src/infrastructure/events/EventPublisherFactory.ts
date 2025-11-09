import { IEventPublisher } from '../../ports/interfaces/IEventPublisher';
import { MockEventPublisher } from './MockEventPublisher';
import { SNSEventPublisher } from './SNSEventPublisher';
import { getEnvConfig } from '../../config/env';
import { getEnvironmentConfig } from '../../config/environment';

export function createEventPublisher(): IEventPublisher {
  const config = getEnvConfig();
  const envConfig = getEnvironmentConfig();

  const publisherType = config.EVENT_PUBLISHER_TYPE || envConfig.getEventPublisherType();

  if (publisherType === 'sns') {
    return new SNSEventPublisher();
  }

  return new MockEventPublisher();
}

