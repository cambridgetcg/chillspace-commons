import {createMeaningHandler} from "./http.mjs";

// Cloudflare adds its Web Analytics beacon script to HTML at the edge unless
// the response says no-transform, so every HTML page says it. The existing
// Cache-Control is kept, and other types are left alone.
function withoutEdgeInjection(response) {
  const type = response.headers.get("Content-Type") || "";
  if (!type.toLowerCase().startsWith("text/html")) return response;
  const cacheControl = response.headers.get("Cache-Control");
  if (cacheControl && /(^|,)\s*no-transform\s*(,|$)/i.test(cacheControl)) return response;
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", cacheControl ? `${cacheControl}, no-transform` : "no-transform");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function createPagesWorker(dataset) {
  const handleMeaning = createMeaningHandler(dataset);

  return {
    async fetch(request, env) {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/api/meaning/echo" || pathname === "/api/meaning/echo/") {
        return handleMeaning(request);
      }
      return withoutEdgeInjection(await env.ASSETS.fetch(request));
    },
  };
}

export {createPagesWorker};
