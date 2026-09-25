export interface ErrorEvent {
  eventId: string;
  eventType: "PAGE_VIEWED" | string;
  eventVersion: number;
  timestamp: string;
  userId: string | null;
  data: {
    errorType: string;
    [key: string]: any; // Allows other dynamic properties inside data
  };
}
