import { apiClient } from "./apiClient";

type OperationRecord = {
  payloadHash: string;
  key: string;
};

const operations = new Map<string, OperationRecord>();

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;

  return `{${Object.keys(value as Record<string, unknown>)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
    .join(",")}}`;
};

const hashPayload = (payload: unknown): string => {
  const source = stableStringify(payload);
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) | 0;
  }

  return `${source.length}:${hash}`;
};

export const createOperationKey = (scope: string, payload: unknown): string => {
  const payloadHash = hashPayload(payload);
  const current = operations.get(scope);

  if (current?.payloadHash === payloadHash) {
    return current.key;
  }

  const key = apiClient.createIdempotencyKey();
  operations.set(scope, { payloadHash, key });
  return key;
};

export const getOperationKey = (scope: string): string | undefined =>
  operations.get(scope)?.key;

export const clearOperationKey = (scope: string): void => {
  operations.delete(scope);
};
