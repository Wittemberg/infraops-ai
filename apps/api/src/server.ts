import { createServer } from "http";
import { handleReadiness, handleMetricsScrape } from "./health/health.controller.js";

const port = Number(process.env.PORT) || 3000;

const server = createServer((req, res) => {
  const url = req.url || "/";

  if (url === "/metrics") {
    res.writeHead(200, { "Content-Type": "text/plain; version=0.0.4" });
    res.end(handleMetricsScrape());
    return;
  }

  const ready = handleReadiness(true, true);
  res.writeHead(ready.statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(ready.body));
});

server.listen(port, "0.0.0.0", () => {
  console.log(`[INFRAOPS_API] Central HTTP server listening on 0.0.0.0:${port}`);
});
