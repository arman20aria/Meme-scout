# Fixing browser API access (DexScreener proxy)

The scanner is a static GitHub Pages site. Browsers can block direct requests to a third-party API because of CORS, network/DNS filtering, or an upstream outage. A static page cannot add CORS headers to DexScreener responses. This small Cloudflare Worker relays only the read-only DexScreener routes used by the scanner and returns the CORS headers needed by the site.

## Deploy the Worker

1. Sign in to Cloudflare and open **Workers & Pages → Create → Create Worker**.
2. Paste the contents of `worker/index.js` into the Worker editor and deploy it.
3. Copy the Worker URL, for example `https://meme-scout-api.<your-account>.workers.dev`.
4. Open `meme_scout_scanner.html` in this repository and change the `API` declaration near the beginning of its script from:

   ```js
   const API='https://api.dexscreener.com';
   ```

   to your Worker URL, with no trailing slash, for example:

   ```js
   const API='https://meme-scout-api.<your-account>.workers.dev';
   ```

5. Commit that change, wait for GitHub Pages to redeploy, then reload the scanner and try a search.

The Worker accepts only GET requests to the scanner's known DexScreener routes, permits browser requests only from `https://arman20aria.github.io`, and caches responses briefly. If you use a custom Pages domain, add its exact `https://` origin to `ALLOWED_ORIGINS` in `worker/index.js` before deployment.

## Verify / diagnose

Open the Worker's base URL in a browser; `Endpoint not allowed` is expected at `/`. Test a known route by opening `/latest/dex/search?q=PEPE` after the Worker hostname. A JSON response means the Worker can reach DexScreener. If the scanner still fails, inspect the browser developer console and Network tab; a Worker 502 points to upstream connectivity, while 429 means the upstream rate limit was reached.

This is a read-only market-data display, not a trading service or a guarantee of prices or token safety. Do not use an unrestricted third-party CORS proxy or put wallet credentials/API secrets in this page.
