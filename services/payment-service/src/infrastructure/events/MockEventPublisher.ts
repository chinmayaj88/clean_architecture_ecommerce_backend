import { IEventPublisher } from '../../ports/interfaces/IEventPublisher';
import { createLogger } from '../logging/logger';

const logger = createLogger();

export class MockEventPublisher implements IEventPublisher {
  private events: Array<{ topic: string; event: Record<string, unknown> }> = [];

  async publish(topic: string, event: Record<string, unknown>): Promise<void> {
    logger.info(`[Event Publisher] Topic: ${topic}`, { event });
    this.events.push({ topic, event });
  }

  getEvents(): Array<{ topic: string; event: Record<string, unknown> }> {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

