export type JsonRecord = Record<string, unknown>;

export function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Keep display fields string-safe without inventing values for missing data. */
export function asText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

export function firstText(record: JsonRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = asText(record[key]);
    if (value) return value;
  }
  return undefined;
}

/**
 * Find a list of records whether the endpoint returns a bare array, a keyed
 * array, or an array nested under `data`. Unknown shapes stay empty.
 */
export function rowsFrom(payload: JsonRecord | JsonRecord[], keys: string[]): JsonRecord[] {
  if (Array.isArray(payload)) return payload.filter(isJsonRecord);
  for (const key of keys) {
    const rows = payload[key];
    if (Array.isArray(rows)) return rows.filter(isJsonRecord);
  }
  if (Array.isArray(payload.data)) return payload.data.filter(isJsonRecord);
  if (isJsonRecord(payload.data)) return rowsFrom(payload.data, keys);
  return [];
}
