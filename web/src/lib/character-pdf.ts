export type CharacterPdfFormData = Record<string, Record<string, unknown>>;

const maximumFieldCount = 2000;
const maximumPdfFormDataBytes = 512_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJsonValue(value: unknown, depth = 0): boolean {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (depth >= 8) {
    return false;
  }
  if (Array.isArray(value)) {
    return (
      value.length <= maximumFieldCount &&
      value.every((item) => isJsonValue(item, depth + 1))
    );
  }
  if (!isRecord(value)) {
    return false;
  }
  const entries = Object.entries(value);
  return (
    entries.length <= maximumFieldCount &&
    entries.every(
      ([key, item]) =>
        key.length <= 200 && isJsonValue(item, depth + 1),
    )
  );
}

export function isCharacterPdfFormData(
  value: unknown,
): value is CharacterPdfFormData {
  if (!isRecord(value)) {
    return false;
  }

  const entries = Object.entries(value);
  if (
    entries.length > maximumFieldCount ||
    !entries.every(
      ([fieldId, fieldValue]) =>
        fieldId.length > 0 &&
        fieldId.length <= 200 &&
        isRecord(fieldValue) &&
        isJsonValue(fieldValue),
    )
  ) {
    return false;
  }

  return (
    new TextEncoder().encode(JSON.stringify(value)).byteLength <=
    maximumPdfFormDataBytes
  );
}
