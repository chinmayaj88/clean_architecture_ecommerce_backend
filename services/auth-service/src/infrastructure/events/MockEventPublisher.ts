/**
 * Mock Event Publisher Implementation
 * For local development and testing
 * In production, this would be replaced with SNS publisher
 */

import { IEventPublisher } from '../../ports/interfaces/IEventPublisher';

export class MockEventPublisher implements IEventPublisher {
  private events: Array<{ topic: string; event: Record<string, unknown> }> = [];

  /**
   * Publish an event (mocked - just logs for local dev)
   */
  async publish(topic: string, event: Record<string, unknown>): Promise<void> {
    // In local dev, just log the event
    console.log(`[Event Publisher] Topic: ${topic}`, JSON.stringify(event, null, 2));
    
    // Store for testing purposes
    this.events.push({ topic, event });
  }

  /**
   * Get published events (for testing)
   */
  getEvents(): Array<{ topic: string; event: Record<string, unknown> }> {
    return [...this.events];
  }

  /**
   * Clear events (for testing)
   */
  clearEvents(): void {
    this.events = [];
  }
}

