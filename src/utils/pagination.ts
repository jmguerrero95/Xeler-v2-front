export interface PaginationMeta {
  current_page?: number;
  currentPage?: number;
  page?: number;
  per_page?: number;
  perPage?: number;
  total?: number;
  last_page?: number;
  lastPage?: number;
  [key: string]: unknown;
}

const unwrapResponse = (response: unknown): any => {
  const maybeAxios = response as { data?: unknown };
  return maybeAxios?.data ?? response;
};

export const getItems = <T = unknown>(response: unknown): T[] => {
  const body = unwrapResponse(response);

  if (Array.isArray(body)) return body as T[];
  if (Array.isArray(body?.data)) return body.data as T[];
  if (Array.isArray(body?.data?.data)) return body.data.data as T[];
  if (Array.isArray(body?.data?.items)) return body.data.items as T[];
  if (Array.isArray(body?.response)) return body.response as T[];
  if (Array.isArray(body?.response?.data)) return body.response.data as T[];
  if (Array.isArray(body?.response?.data?.data)) return body.response.data.data as T[];
  if (Array.isArray(body?.response?.items)) return body.response.items as T[];
  if (Array.isArray(body?.payload)) return body.payload as T[];
  if (Array.isArray(body?.payload?.data)) return body.payload.data as T[];
  if (Array.isArray(body?.payload?.items)) return body.payload.items as T[];
  if (Array.isArray(body?.items)) return body.items as T[];

  return [];
};

export const getPayload = <T = unknown>(response: unknown): T | null => {
  const body = unwrapResponse(response);

  return (body?.data ?? body?.response ?? body?.payload ?? body ?? null) as T | null;
};

export const getMeta = (response: unknown): PaginationMeta => {
  const body = unwrapResponse(response);
  const responseBody = body?.response;
  const nestedData = body?.data;
  const payload = body?.payload;
  const meta =
    body?.meta ??
    nestedData?.meta ??
    responseBody?.meta ??
    responseBody?.data?.meta ??
    payload?.meta;

  if (meta) return meta;

  const paginator =
    nestedData?.current_page !== undefined
      ? nestedData
      : responseBody?.current_page !== undefined
        ? responseBody
        : responseBody?.data?.current_page !== undefined
          ? responseBody.data
          : payload?.current_page !== undefined
            ? payload
            : body;

  return {
    current_page: paginator?.current_page ?? paginator?.currentPage ?? paginator?.page,
    per_page: paginator?.per_page ?? paginator?.perPage,
    total: paginator?.total,
    last_page: paginator?.last_page ?? paginator?.lastPage,
  };
};

export const getCurrentPage = (meta: PaginationMeta): number =>
  Number(meta?.current_page ?? meta?.currentPage ?? meta?.page ?? 1) || 1;

export const getTotal = (meta: PaginationMeta): number =>
  Number(meta?.total ?? 0) || 0;

export const getPerPage = (meta: PaginationMeta): number =>
  Number(meta?.per_page ?? meta?.perPage ?? 15) || 15;

export const getLastPage = (meta: PaginationMeta): number =>
  Number(meta?.last_page ?? meta?.lastPage ?? 1) || 1;
