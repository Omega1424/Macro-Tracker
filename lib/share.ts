/**
 * Encode / decode meal plan as a URL hash.
 * Format: #plan=<base64url-encoded JSON>
 */

export function encodePlan(data: unknown): string {
  try {
    const json = JSON.stringify(data);
    const b64  = btoa(encodeURIComponent(json));
    return b64;
  } catch {
    return "";
  }
}

export function decodePlan<T>(hash: string): T | null {
  try {
    const b64  = hash.replace(/^#?plan=/, "");
    const json = decodeURIComponent(atob(b64));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function getHashPlan<T>(): T | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (!hash.startsWith("#plan=")) return null;
  return decodePlan<T>(hash);
}

export function setHashPlan(data: unknown): void {
  if (typeof window === "undefined") return;
  const encoded = encodePlan(data);
  if (encoded) {
    history.replaceState(null, "", `#plan=${encoded}`);
  }
}

export function clearHashPlan(): void {
  if (typeof window === "undefined") return;
  history.replaceState(null, "", window.location.pathname);
}
