export class HttpError extends Error {
  constructor(statusCode, detail) {
    super(detail);
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

export function toHttpError(error) {
  if (error instanceof HttpError) {
    return error;
  }
  return new HttpError(500, error?.message || "Internal Server Error");
}
