type EventHandler = (event: Record<string, unknown>) => Promise<void>;

export interface IEventConsumer {
  subscribe(eventType: string, handler: EventHandler): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
}

