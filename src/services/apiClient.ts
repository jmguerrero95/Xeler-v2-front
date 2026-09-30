import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type Method,
} from "axios";
import { handleAuthError, normalizeApiError } from "./apiErrors";
import { getAuthToken } from "./authToken";
import { financialScopeForPath, takeFinancialStepUp, type FinancialStepUpScope } from "./securityStepUp";

export interface ApiClientOptions extends AxiosRequestConfig {
  idempotent?: boolean;
  idempotencyKey?: string;
  financialAction?: boolean;
  financialScope?: FinancialStepUpScope;
  silent?: boolean;
  raw?: boolean;
  headers?: Record<string, string>;
}

export interface NormalizedApiResponse<T = unknown> {
  payload: T;
  data?: unknown;
  meta?: unknown;
  legacyResponse?: unknown;
  raw: AxiosResponse;
}

const officialApiBase = (): string => import.meta.env.VITE_API_URL;

const hasAmbiguousExternalPrefix = (url: string): boolean =>
  /^[\\/]{2}/.test(url);

export const isOfficialApiDestination = (
  url: string,
  baseURL = officialApiBase(),
): boolean => {
  try {
    if (hasAmbiguousExternalPrefix(url)) return false;

    const official = new URL(officialApiBase(), window.location.origin);
    const effectiveUrl = axios.getUri({ baseURL, url });
    const destination = new URL(effectiveUrl, window.location.origin);
    const officialPath = official.pathname.replace(/\/+$/, "");

    return (
      ["http:", "https:"].includes(destination.protocol) &&
      destination.origin === official.origin &&
      (destination.pathname === officialPath ||
        destination.pathname.startsWith(`${officialPath}/`))
    );
  } catch {
    return false;
  }
};

const withoutAuthorization = (
  headers: Record<string, string> = {},
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(headers).filter(
      ([name]) => name.toLowerCase() !== "authorization",
    ),
  );

const generateUuid = (): string => {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

const shouldAttachIdempotencyKey = (
  method: Method,
  options: ApiClientOptions,
): boolean => {
  if (method.toLowerCase() === "get") return false;
  return Boolean(options.idempotent || options.financialAction || options.financialScope);
};

export const normalizeApiResponse = <T = unknown>(
  response: AxiosResponse,
): NormalizedApiResponse<T> => {
  const body = response.data;

  return {
    payload: body?.response ?? body?.data ?? body,
    data: body?.data,
    meta: body?.meta,
    legacyResponse: body?.response,
    raw: response,
  };
};

const request = async <T = unknown>(
  method: Method,
  url: string,
  options: ApiClientOptions = {},
): Promise<AxiosResponse<T>> => {
  const token = getAuthToken();
  const baseURL = options.baseURL ?? officialApiBase();
  const officialDestination = isOfficialApiDestination(url, baseURL);
  const headers: Record<string, string> = {
    ...withoutAuthorization(options.headers ?? {}),
    "X-Request-Id": options.headers?.["X-Request-Id"] ?? generateUuid(),
  };

  if (token && officialDestination) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (shouldAttachIdempotencyKey(method, options)) {
    headers["Idempotency-Key"] = options.idempotencyKey ?? generateUuid();
  }
  const requestedFinancialScope = options.financialScope ?? (options.financialAction ? financialScopeForPath(url) : undefined);
  if (requestedFinancialScope && officialDestination) {
    const grant = takeFinancialStepUp(requestedFinancialScope);
    if (grant) headers["X-Financial-Step-Up"] = grant;
  }

  try {
    return await axios.request<T>({
      ...options,
      baseURL,
      url,
      method,
      headers,
    });
  } catch (error) {
    if (!officialDestination) throw error;

    const normalizedError = normalizeApiError(error);
    handleAuthError(normalizedError);
    throw normalizedError;
  }
};

const publicRequest = <T = unknown>(
  method: Method,
  url: string,
  options: AxiosRequestConfig = {},
): Promise<AxiosResponse<T>> =>
  axios.request<T>({
    ...options,
    url,
    method,
    headers: withoutAuthorization(
      (options.headers ?? {}) as Record<string, string>,
    ),
  });

export const publicHttpClient = {
  request: publicRequest,
  get: <T = unknown>(url: string, options: AxiosRequestConfig = {}) =>
    publicRequest<T>("get", url, options),
  post: <T = unknown>(
    url: string,
    data?: unknown,
    options: AxiosRequestConfig = {},
  ) => publicRequest<T>("post", url, { ...options, data }),
};

export const apiClient = {
  request,
  get: <T = unknown>(url: string, options: ApiClientOptions = {}) =>
    request<T>("get", url, options),
  post: <T = unknown>(
    url: string,
    data?: unknown,
    options: ApiClientOptions = {},
  ) => request<T>("post", url, { ...options, data }),
  put: <T = unknown>(
    url: string,
    data?: unknown,
    options: ApiClientOptions = {},
  ) => request<T>("put", url, { ...options, data }),
  patch: <T = unknown>(
    url: string,
    data?: unknown,
    options: ApiClientOptions = {},
  ) => request<T>("patch", url, { ...options, data }),
  delete: <T = unknown>(url: string, options: ApiClientOptions = {}) =>
    request<T>("delete", url, options),
  normalize: normalizeApiResponse,
  createIdempotencyKey: generateUuid,
};

export const downloadAuthenticatedBlob = async (
  url: string,
  fallbackName = "comprobante",
): Promise<void> => {
  const officialBase = new URL(officialApiBase(), window.location.origin);
  const apiPrefix = officialBase.pathname.endsWith("/")
    ? officialBase.pathname.slice(0, -1)
    : officialBase.pathname;

  const isAbsoluteUrl =
    url.startsWith("http://") || url.startsWith("https://");

  const normalizedUrl =
    !isAbsoluteUrl && apiPrefix && url.startsWith(`${apiPrefix}/`)
      ? url.slice(apiPrefix.length)
      : url;

  const response = await apiClient.get<Blob>(
    normalizedUrl,
    { responseType: "blob" },
  );
  const disposition = response.headers["content-disposition"] as string | undefined;
  const encodedName = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plainName = disposition?.match(/filename="?([^";]+)"?/i)?.[1];
  const filename = encodedName
    ? decodeURIComponent(encodedName)
    : plainName ?? fallbackName;
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement("a");

  try {
    link.href = objectUrl;
    link.download = filename;
    link.rel = "noopener";
    link.click();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
