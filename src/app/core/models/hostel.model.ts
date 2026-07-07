export const HOSTEL_ALLOCATION_STATUS = {
  Allocated: 1,
  Vacated: 2,
} as const;

export const HOSTEL_ALLOCATION_STATUS_LABEL: Partial<Record<number, string>> = {
  [HOSTEL_ALLOCATION_STATUS.Allocated]: 'Allocated',
  [HOSTEL_ALLOCATION_STATUS.Vacated]: 'Vacated',
};

export interface HostelRoom {
  id: number;
  hostelBlock: string;
  roomNumber: string;
  capacity: number;
  isActive: boolean;
}

export interface HostelRoomListItem {
  id: number;
  hostelBlock: string | null;
  roomNumber: string | null;
  capacity: number;
  occupiedCount: number;
  isActive: boolean;
}

export interface AllocateRoomRequest {
  roomId: number;
  studentId: number;
}

export interface HostelAllocationListItem {
  id: number;
  roomId: number;
  hostelBlock: string | null;
  roomNumber: string | null;
  studentId: number;
  studentName: string | null;
  allocationDate: string;
  vacateDate: string | null;
  status: number;
}

export interface HostelActionResult {
  isSuccess: boolean;
  errorMessage: string | null;
}
