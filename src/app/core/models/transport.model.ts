export interface AssignTransportRequest {
  studentId: number;
  busStoppageId: number;
}

export interface TransportRosterRow {
  studentId: number;
  studentName: string | null;
  className: string | null;
  sectionName: string | null;
  contactNumber: string | null;
}

export interface StoppageSummaryRow {
  busStoppageId: number;
  stoppageName: string | null;
  studentCount: number;
}

export interface RouteSummaryDTO {
  busRouteId: number;
  routeName: string | null;
  stoppages: StoppageSummaryRow[];
}
