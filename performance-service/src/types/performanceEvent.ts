export interface PerformanceEvent {
  eventId: string;
  eventType: "PAGE_VIEWED" | string;
  eventVersion: number;
  timestamp: string;
  userId: string | null;
  data: {
    endpoint: string;
    durationMs: number;
    [key: string]: any; // Allows other dynamic properties inside data
  };
}
