/**
 * Normaliza colecciones de los sobres legacy y modernos sin asumir que una
 * respuesta temporalmente vacía tenga la forma paginada legacy.
 */
export const responseCollection = <T>(response: unknown): T[] => {
  const body = (response as { data?: unknown } | undefined)?.data as
    | { response?: unknown; data?: unknown; payload?: unknown }
    | undefined;
  const candidate = body?.response ?? body?.data ?? body?.payload ?? [];

  if (Array.isArray(candidate)) return candidate as T[];
  if (Array.isArray((candidate as { data?: unknown } | undefined)?.data)) {
    return (candidate as { data: T[] }).data;
  }

  return [];
};
