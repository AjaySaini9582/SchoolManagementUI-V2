export enum StatusCode {
  Success = 200,
  Created = 201,
  Accepted = 202,
  NoContent = 204,
  PartialContent = 206,
  Information = 207,
  Warning = 299,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  Error = 500,
}

export interface BaseResponse<T = unknown> {
  isSuccess: boolean;
  data: T | null;
  message: string | null;
  errorMessage: string | null;
  statusCode: StatusCode | null;
}

export interface BaseRequest<T> {
  data: T;
}
