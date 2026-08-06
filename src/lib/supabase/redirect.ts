export function getAuthRedirectUrl(path = "/"): string {
  let origin = "";

  if (typeof window !== "undefined" && window.location.origin) {
    origin = window.location.origin;
  } else if (process.env.NEXT_PUBLIC_SITE_URL) {
    origin = process.env.NEXT_PUBLIC_SITE_URL;
  } else if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
    origin = vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
  } else {
    origin = "http://localhost:3000";
  }

  const cleanOrigin = origin.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanOrigin}${cleanPath}`;
}

