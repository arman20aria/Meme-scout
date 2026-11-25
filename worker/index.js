const UPSTREAM = "https://api.dexscreener.com";
const ALLOWED_ORIGINS = new Set([
  "https://arman20aria.github.io",
]);
const ALLOWED_PATHS = [
  /^\/latest\/dex\/search$/,
  /^\/token-profiles\/latest\/v1$/,
  /^\/token-boosts\/latest\/v1$/,
  /^\/token-pairs\/v1\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9xX]+$/,
];

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (request.method !== "GET" && request.method !== "OPTIONS") {
      return new Response("Method not allowed", { status: 405 });
    }
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return new Response("Origin not allowed", { status: 403 });
    }

    const cors = origin ? corsHeaders(origin) : {};
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    // Only relay the specific read-only DexScreener endpoints used by the app.
    if (!ALLOWED_PATHS.some((pattern) => pattern.test(url.pathname))) {
      return new Response("Endpoint not allowed", { status: 404, headers: cors });
    }
    const query = url.searchParams.toString();
    if (query.length > 300 || (url.searchParams.has("q") && url.searchParams.get("q").length > 100)) {
      return new Response("Query too long", { status: 400, headers: cors });
    }

    const upstreamUrl = new URL(url.pathname + url.search, UPSTREAM);
    try {
      const upstream = await fetch(upstreamUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        cf: { cacheTtl: 15, cacheEverything: true },
      });
      const headers = new Headers(cors);
      headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/json; charset=utf-8");
      headers.set("Cache-Control", "public, max-age=15");
      return new Response(upstream.body, { status: upstream.status, headers });
    } catch {
      return new Response(JSON.stringify({ error: "DexScreener upstream request failed" }), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
      });
    }
  },
};
