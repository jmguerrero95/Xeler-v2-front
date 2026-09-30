import type { AxiosError, AxiosResponse } from "axios";
import { clearAuthToken } from "./authToken";

export interface NormalizedApiError {
  status?: number;
  code?: string;
  message: string;
  messages: string[];
  validationErrors: Record<string, string[]>;
  retryAfter?: string;
  isNetworkError: boolean;
  original: unknown;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => toStringArray(item));
  }

  if (typeof value === "string") {
    return [value];
  }

  if (value == null) {
    return [];
  }

  return [String(value)];
};

const extractValidationErrors = (data: unknown): Record<string, string[]> => {
  const body = asRecord(data);
  const nestedData = asRecord(body.data);
  const candidates = [body.errors, nestedData.errors];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;

    return Object.entries(candidate as Record<string, unknown>).reduce(
      (errors, [field, value]) => {
        errors[field] = toStringArray(value);
        return errors;
      },
      {} as Record<string, string[]>,
    );
  }

  return {};
};

const extractMessages = (
  data: unknown,
  fallback: string,
  validationErrors: Record<string, string[]>,
): string[] => {
  const body = asRecord(data);
  const nestedData = asRecord(body.data);
  const directMessages = [
    ...toStringArray(body.message),
    ...toStringArray(nestedData.message),
  ];

  const validationMessages = Object.values(validationErrors).flat();
  const messages = [...directMessages, ...validationMessages].filter(Boolean);

  return messages.length > 0 ? [...new Set(messages)] : [fallback];
};

const defaultMessageByStatus = (
  status?: number,
  retryAfter?: string,
): string => {
  switch (status) {
    case 401:
      return "Tu sesion expiro. Inicia sesion nuevamente.";
    case 403:
      return "No tienes permisos para realizar esta accion.";
    case 405:
      return "Accion no permitida con este metodo. El flujo debe actualizarse.";
    case 409:
      return "La operacion tiene un conflicto de estado o ya esta en proceso.";
    case 422:
      return "Hay datos invalidos. Revisa la informacion enviada.";
    case 423:
      return "Tu cuenta está restringida. La sesión fue cerrada.";
    case 429:
      return retryAfter
        ? `Demasiados intentos. Intenta nuevamente en ${retryAfter} segundos.`
        : "Demasiados intentos. Intenta nuevamente mas tarde.";
    default:
      return status && status >= 500
        ? "Ocurrio un error inesperado en el servidor."
        : "No fue posible completar la solicitud.";
  }
};

export const clearAuthStorage = (): void => {
  clearAuthToken();
  sessionStorage.removeItem("user");
  localStorage.removeItem("user");
};

let redirectingToLogin = false;
let explicitLogoutInProgress = false;

export const beginExplicitLogout = (): void => {
  explicitLogoutInProgress = true;
};

export const endExplicitLogout = (): void => {
  explicitLogoutInProgress = false;
};

export const redirectToLogin = (): void => {
  if (!redirectingToLogin && window.location.pathname !== "/login") {
    redirectingToLogin = true;
    window.location.assign("/login");
  }
};

export const normalizeApiError = (error: unknown): NormalizedApiError => {
  const axiosError = error as AxiosError;
  const response = axiosError.response as AxiosResponse | undefined;
  const status = response?.status;
  const responseBody = asRecord(response?.data);
  const retryAfter = response?.headers?.["retry-after"]?.toString();
  const isNetworkError = !response;
  const fallback = isNetworkError
    ? "Servidor no disponible o solicitud bloqueada por CORS."
    : defaultMessageByStatus(status, retryAfter);
  const validationErrors = extractValidationErrors(response?.data);
  const messages = extractMessages(response?.data, fallback, validationErrors);

  return {
    status,
    code: typeof responseBody.code === "string" ? responseBody.code : undefined,
    message: messages[0] ?? fallback,
    messages,
    validationErrors,
    retryAfter,
    isNetworkError,
    original: error,
  };
};

export const handleAuthError = (error: NormalizedApiError): void => {
  if (![401, 423].includes(error.status ?? 0) || explicitLogoutInProgress) return;

  clearAuthStorage();
  redirectToLogin();
};
