/**
 * Error thrown by the API layer. `code` mirrors the backend's error codes so callers and
 * toasts can react to the category without parsing messages.
 */
export type ApiErrorCode =
  | "bad_request"
  | "validation_failed"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "unavailable"
  | "internal";

export class ApiClientError extends Error {
  code: ApiErrorCode;
  status?: number;
  requestId?: string;
  details?: { field: string; message: string }[];

  constructor(
    code: ApiErrorCode,
    message: string,
    options: { status?: number; requestId?: string; details?: { field: string; message: string }[] } = {},
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = options.status;
    this.requestId = options.requestId;
    this.details = options.details;
  }

  get isUnauthenticated() {
    return this.code === "unauthenticated";
  }
}

/** Map an HTTP status to the backend's error taxonomy. */
export function codeForStatus(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return "bad_request";
    case 401:
      return "unauthenticated";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    case 422:
      return "validation_failed";
    case 429:
      return "rate_limited";
    case 503:
      return "unavailable";
    default:
      return status >= 500 ? "internal" : "bad_request";
  }
}
