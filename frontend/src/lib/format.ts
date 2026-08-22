const DATE_FALLBACK = "—";

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

function formatTimestamp(ms: number): string {
  if (Number.isNaN(ms)) {
    return DATE_FALLBACK;
  }
  return new Date(ms).toLocaleString("en-US", DATE_FORMAT_OPTIONS);
}

/**
 * Format a protobuf-style seconds string into a human-readable date,
 */
export function formatDateFromSeconds(value?: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return DATE_FALLBACK;
  }
  return formatTimestamp(Number(trimmed) * 1000);
}

/**
 * Format an ISO date string into a human-readable date,
 */
export function formatDateFromISO(value?: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return DATE_FALLBACK;
  }
  return formatTimestamp(Date.parse(trimmed));
}

/**
 * Format a google.protobuf.Timestamp, whichever shape the transport produced.
 *
 * The two backend transports disagree here: local talks gRPC and the client
 * (loaded with longs: String) yields `{ seconds, nanos }`, while dev/preprod/prod
 * answer over Connect, where protojson encodes timestamps as RFC-3339 strings.
 */
export function formatProtoDate(value?: ProtoTimestampValue): string {
  return typeof value === "string"
    ? formatDateFromISO(value)
    : formatDateFromSeconds(value?.seconds);
}

export type ProtoTimestampValue =
  | string
  | { seconds?: string; nanos?: number };