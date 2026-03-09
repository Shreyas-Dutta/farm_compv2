import type { IncomingMessage } from "node:http";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const PLANTNET_PROXY_PREFIX = "/api-proxy/plantnet";

const readRequestBody = async (request: IncomingMessage) => {
  const chunks: Uint8Array[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
};

const plantNetDevProxy = () => ({
  name: "plantnet-dev-proxy",
  configureServer(server: import("vite").ViteDevServer) {
    server.middlewares.use(async (request, response, next) => {
      if (!request.url?.startsWith(PLANTNET_PROXY_PREFIX) || String(request.method || "GET").toUpperCase() !== "POST") {
        next();
        return;
      }

      try {
        const upstreamPath = request.url.replace(PLANTNET_PROXY_PREFIX, "");
        const requestBody = await readRequestBody(request);
        const upstreamResponse = await fetch(new URL(upstreamPath, "https://my-api.plantnet.org"), {
          method: "POST",
          headers: {
            ...(typeof request.headers["content-type"] === "string" ? { "content-type": request.headers["content-type"] } : {}),
            ...(typeof request.headers.accept === "string" ? { accept: request.headers.accept } : {}),
          },
          body: requestBody.length > 0 ? requestBody : undefined,
        });
        const responseText = await upstreamResponse.text();
        const isSpeciesNotFound = upstreamResponse.status === 404 && responseText.trim().toLowerCase().includes("species not found");

        response.statusCode = isSpeciesNotFound ? 200 : upstreamResponse.status;
        response.setHeader(
          "content-type",
          isSpeciesNotFound ? "application/json; charset=utf-8" : upstreamResponse.headers.get("content-type") || "text/plain; charset=utf-8"
        );
        response.end(
          isSpeciesNotFound
            ? JSON.stringify({ warning: "species_not_found", results: [] })
            : responseText
        );
      } catch {
        response.statusCode = 502;
        response.setHeader("content-type", "application/json; charset=utf-8");
        response.end(JSON.stringify({ message: "PlantNet proxy request failed" }));
      }
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api-proxy/data-gov": {
        target: "https://api.data.gov.in",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy\/data-gov/, ""),
      },
    },
  },
  plugins: [plantNetDevProxy(), react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
