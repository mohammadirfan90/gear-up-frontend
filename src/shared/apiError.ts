import { AxiosError } from "axios";

/**
 * The server answers every failure with
 *   { success: false, message: string, errorDetails: Record<string, string> }
 *
 * Axios throws an Error whose `.message` is the useless
 * "Request failed with status code 409", so reading `error.message` directly
 * in a toast discards the real explanation. Everything user-facing should go
 * through here instead.
 */
interface ApiErrorBody {
  success?: boolean;
  message?: string;
  errorDetails?: Record<string, unknown>;
}

const STATUS_FALLBACKS: Record<number, string> = {
  400: "That request wasn't valid. Please check the details and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: "That conflicts with the current state. Refresh and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our end. Please try again shortly.",
};

const isAxiosError = (error: unknown): error is AxiosError<ApiErrorBody> =>
  typeof error === "object" &&
  error !== null &&
  (error as AxiosError).isAxiosError === true;

/**
 * Field-level messages from a validation failure, keyed by form field.
 * Feed these into react-hook-form's `setError` for inline form errors.
 */
export const getApiFieldErrors = (
  error: unknown,
): Record<string, string> | undefined => {
  if (!isAxiosError(error)) return undefined;
  const details = error.response?.data?.errorDetails;
  if (!details || typeof details !== "object") return undefined;

  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(details)) {
    // `stack` is only present in the server's non-production error payload.
    if (key === "stack") continue;
    if (typeof value === "string") fields[key] = value;
  }
  return Object.keys(fields).length > 0 ? fields : undefined;
};

/** A single human-readable sentence suitable for a toast or inline banner. */
export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string => {
  if (isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return "The request timed out. Check your connection and try again.";
    }
    if (!error.response) {
      return "We couldn't reach the server. Check your connection and try again.";
    }

    const message = error.response.data?.message;
    const status = error.response.status;

    // Prefer the specific field message over a generic "Validation failed".
    const fields = getApiFieldErrors(error);
    const firstField = fields ? Object.values(fields)[0] : undefined;

    if (message && message !== "Validation failed") return message;
    if (firstField) return firstField;
    if (message) return message;

    return STATUS_FALLBACKS[status] ?? fallback;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
};
