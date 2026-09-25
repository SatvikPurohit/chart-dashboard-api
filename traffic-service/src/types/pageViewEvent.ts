export interface PageViewEvent {
  eventId: string;
  eventType: "PAGE_VIEWED" | string;
  eventVersion: number;
  timestamp: string;
  userId: string | null;
  data: {
    page: string;
    [key: string]: any; // Allows other dynamic properties inside data
  };
}
