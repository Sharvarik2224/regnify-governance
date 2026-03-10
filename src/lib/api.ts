const DEFAULT_API_BASE_URL = "http://localhost:5000";

const normalizeApiBaseUrl = (rawValue: unknown) => {
  const raw = String(rawValue ?? "").trim();

  if (!raw) {
    return DEFAULT_API_BASE_URL;
  }

  const candidate = /^https?:\/\//i.test(raw)
    ? raw
    : raw.startsWith(":")
      ? `http://localhost${raw}`
      : `http://${raw}`;

  try {
    const parsed = new URL(candidate);
    if (!parsed.hostname) {
      return DEFAULT_API_BASE_URL;
    }
    return parsed.origin;
  } catch {
    return DEFAULT_API_BASE_URL;
  }
};

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
