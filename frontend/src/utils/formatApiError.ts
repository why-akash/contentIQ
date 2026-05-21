import axios from "axios";

const parseDetailValue = (
  detail: unknown,
): string | null => {
  if (detail == null) {
    return null;
  }

  if (typeof detail === "string") {
    return detail.trim() || null;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (
          item &&
          typeof item === "object" &&
          "msg" in item
        ) {
          return String(
            (item as { msg: unknown }).msg,
          );
        }

        return null;
      })
      .filter(Boolean);

    return messages.length > 0
      ? messages.join(" ")
      : null;
  }

  if (typeof detail === "object") {
    const obj = detail as Record<
      string,
      unknown
    >;

    const parts: string[] = [];

    if (typeof obj.message === "string") {
      parts.push(obj.message);
    }

    if (typeof obj.solution === "string") {
      parts.push(obj.solution);
    }

    if (typeof obj.retry_after === "string") {
      parts.push(
        `Retry after ${obj.retry_after}.`,
      );
    }

    if (parts.length > 0) {
      return parts.join(" ");
    }
  }

  return null;
};

const statusFallback = (
  status: number,
): string | null => {
  switch (status) {
    case 400:
      return "Invalid request. Please check the YouTube link and try again.";
    case 403:
      return "This video cannot be processed (access or transcript restrictions).";
    case 404:
      return "No transcript found for this video.";
    case 429:
      return "Too many requests. Please wait and try again.";
    case 500:
    case 502:
    case 503:
      return "Server error. Please try again in a moment.";
    default:
      return null;
  }
};

export const formatApiError = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string => {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }

  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please try again.";
    }

    if (error.message === "Network Error") {
      return "Unable to reach the backend service. Please check that it is running.";
    }

    return "Unable to reach the backend service. Please try again.";
  }

  const data = error.response.data as
    | Record<string, unknown>
    | string
    | undefined;

  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  if (data && typeof data === "object") {
    const fromDetail = parseDetailValue(
      data.detail,
    );

    if (fromDetail) {
      return fromDetail;
    }

    if (typeof data.message === "string") {
      return data.message;
    }

    if (typeof data.error === "string") {
      return data.error;
    }
  }

  const fromStatus = statusFallback(
    error.response.status,
  );

  if (fromStatus) {
    return fromStatus;
  }

  return fallback;
};
