/**
 * Event Publisher Interface - Port
 * Defines the contract for publishing async events (SNS/SQS)
 * Allows swapping implementations (SNS, in-memory for testing)
 */

export interface IEventPublisher {
  /**
   * Publish an event
   * @param topic - Event topic/channel name
   * @param event - Event payload
   */
  publish(topic: string, event: Record<string, unknown>): Promise<void>;
}

/**
 * Event schemas for type safety
 */
export interface UserCreatedEvent extends Record<string, unknown> {
  userId: string;
  email: string;
  timestamp: string;
  source: 'auth-service';
}

export interface UserUpdatedEvent {
  userId: string;
  email?: string;
  isActive?: boolean;
  timestamp: string;
  source: 'auth-service';
}

