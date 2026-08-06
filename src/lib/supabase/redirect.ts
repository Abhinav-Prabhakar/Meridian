export function getAuthRedirectUrl(path = "/"): string {
  if (typeof window === "undefined") {
    return path;
  }

  // Always prefer the actual browser origin in a deployed build. This avoids
  // inheriting Supabase's local-development Site URL on Vercel.
  const origin = window.location.origin;
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const base = configuredOrigin && !isLocalhost(configuredOrigin) ? configuredOrigin : origin;
  return new URL(path, `${base}/`).toString();
}

function isLocalhost(value: string): boolean {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return false;
  }
}
