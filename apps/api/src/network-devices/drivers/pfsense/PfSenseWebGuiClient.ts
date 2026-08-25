import https from "https";
import http from "http";

export type TlsMode = "VERIFY" | "ALLOW_SELF_SIGNED" | "PINNED_FINGERPRINT";

export interface HttpResponse {
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  cookies: string[];
  data: string;
}

export class PfSenseWebGuiClient {
  private host: string;
  private port: number;
  private timeoutMs: number;
  private tlsMode: TlsMode;
  private pinnedFingerprint?: string;

  constructor(
    host: string,
    port: number = 8181,
    timeoutMs: number = 8000,
    tlsMode: TlsMode = "ALLOW_SELF_SIGNED",
    pinnedFingerprint?: string
  ) {
    this.host = host;
    this.port = port;
    this.timeoutMs = timeoutMs;
    this.tlsMode = tlsMode;
    this.pinnedFingerprint = pinnedFingerprint;
  }

  public makeRequest(
    path: string,
    method: "GET" | "POST" = "GET",
    postData?: string,
    cookie?: string,
    extraHeaders?: Record<string, string>
  ): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
      const isHttps = this.port !== 80;
      const client = isHttps ? https : http;

      const options: https.RequestOptions = {
        hostname: this.host,
        port: this.port,
        path: path,
        method: method,
        rejectUnauthorized: this.tlsMode === "VERIFY",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) InfraOpsAI-pfSenseDriver/2.0",
        },
      };

      if (cookie && options.headers) {
        options.headers["Cookie"] = cookie;
      }

      if (extraHeaders && options.headers) {
        Object.assign(options.headers, extraHeaders);
      }

      if (postData && options.headers) {
        options.headers["Content-Type"] = "application/x-www-form-urlencoded";
        options.headers["Content-Length"] = Buffer.byteLength(postData);
      }

      const timer = setTimeout(() => {
        req.destroy();
        reject(new Error(`Timeout de conexão (${this.timeoutMs}ms) ao acessar https://${this.host}:${this.port}${path}`));
      }, this.timeoutMs);

      const req = client.request(options, (res) => {
        clearTimeout(timer);
        let data = "";
        const cookies: string[] = [];
        if (res.headers["set-cookie"]) {
          for (const c of res.headers["set-cookie"]) {
            cookies.push(c.split(";")[0]);
          }
        }

        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            cookies,
            data,
          });
        });
      });

      req.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });

      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  }
}
