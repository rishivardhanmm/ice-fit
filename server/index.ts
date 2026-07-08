import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { apiRouter } from "./routes/api.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT ?? 3000);
const host = cliValue("--hostname") ?? cliValue("--host") ?? process.env.HOST ?? "0.0.0.0";
const isProduction = process.env.NODE_ENV === "production";

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use("/api", apiRouter);

if (isProduction) {
  const distPath = join(__dirname, "..", "..", "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => res.sendFile(join(distPath, "index.html")));
} else {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      host,
      hmr: { host: host === "0.0.0.0" ? undefined : host }
    },
    appType: "spa"
  });
  app.use(vite.middlewares);
}

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: "Unexpected server error" });
});

const server = createServer(app);
server.listen(port, host, () => {
  console.log(`Ice Fit running at http://${host}:${port}`);
  console.log("For iPhone testing, open http://<laptop-ip>:3000 on the same Wi-Fi network.");
});

function cliValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

