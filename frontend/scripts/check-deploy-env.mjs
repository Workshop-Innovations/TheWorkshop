const value = process.env.VITE_API_URL;
let url;
try {
  url = new URL(value);
} catch {
  throw new Error(
    "Set VITE_API_URL to the public HTTPS API origin before building for deployment.",
  );
}
if (
  url.protocol !== "https:" ||
  ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
  url.username ||
  url.password ||
  url.pathname !== "/" ||
  url.search ||
  url.hash
) {
  throw new Error(
    "VITE_API_URL must be an HTTPS API origin with no path, credentials, query or fragment.",
  );
}
