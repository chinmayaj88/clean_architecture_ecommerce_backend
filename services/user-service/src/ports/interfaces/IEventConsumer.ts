/**
 * Event Consumer Interface - Port
 * Defines the contract for consuming events from other services
 */

export interface IEventConsumer {
  /**
   * Start consuming events
   */
  start(): Promise<void>;
  
  /**
   * Stop consuming events
   */
  stop(): Promise<void>;
  
  /**
   * Subscribe to an event topic
   */
  subscribe(topic: string, handler: (event: Record<string, unknown>) => Promise<void>): void;
}

