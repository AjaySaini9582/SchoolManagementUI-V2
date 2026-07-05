export interface DataTableParameters {
  draw: number;
  start: number;
  length: number;
  searchValue: string | null;
  sortColumn: string | null;
  sortDirection: string | null;
}

export interface DataTableRequest<T> {
  dataTableParameters: DataTableParameters;
  requestModal: T;
}

export interface DataTableResponse<T = unknown> {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: T[];
  fileDirectoryPath: string | null;
}

export interface ProcessesRequest {
  employeeId: number;
  dateOfBirth: string | null;
}
