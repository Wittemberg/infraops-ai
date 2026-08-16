import { createServer } from "http";

const port = Number(process.env.PORT) || 3000;

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", service: "infraops-worker", timestamp: new Date().toISOString() }));
});

server.listen(port, "0.0.0.0", () => {
  console.log(`[INFRAOPS_WORKER] Worker process listening on 0.0.0.0:${port}`);
});
