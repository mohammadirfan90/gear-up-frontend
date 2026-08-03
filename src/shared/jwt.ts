export interface DecodedJwtPayload {
  id: string;
  email?: string;
  role?: "customer" | "provider" | "admin";
  iat?: number;
  exp?: number;
}

const decodeBase64Url = (input: string): string => {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  if (typeof atob === "function") {
    return atob(padded + padding);
  }
  return Buffer.from(padded + padding, "base64").toString("utf8");
};

export const decodeJwt = (token: string): DecodedJwtPayload | null => {
  if (!token) return null;
  const segments = token.split(".");
  if (segments.length < 2) return null;
  try {
    const json = decodeBase64Url(segments[1]);
    return JSON.parse(json) as DecodedJwtPayload;
  } catch {
    return null;
  }
};

export const isJwtExpired = (payload: DecodedJwtPayload | null): boolean => {
  if (!payload?.exp) return false;
  return Date.now() >= payload.exp * 1000;
};
