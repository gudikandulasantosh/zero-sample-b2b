import type { ApiErrorPayload } from "../types";

export async function readApiError(response: Response, fallback: string) {
  try {
    const payload: ApiErrorPayload = await response.json();
    if (payload.detail) {
      return payload.detail;
    }
    if (payload.message) {
      return payload.message;
    }
    return fallback;
  } catch {
    return fallback;
  }
}
