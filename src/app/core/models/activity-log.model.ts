export interface ActivityLogEntry {
  entityType: string;
  entityId: number;
  action: string;
  timestamp: string;
  userId: number | null;
  userName: string | null;
  description: string | null;
}
