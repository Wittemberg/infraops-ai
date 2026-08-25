import https from "https";
import http from "http";
import querystring from "querystring";

export interface PfSenseResource {
  cpuLoad?: number;
  freeMemoryPercent?: number;
  usedMemoryPercent?: number;
  version?: string;
  uptime?: string;
  model?: string;
}

export class PfSenseApiClient {
  private host: string;
  private port: number;
  private timeoutMs: number;

  constructor(host: string, port: number = 443, timeoutMs: number = 8000) {
    this.host = host;
    this.port = port;
    this.timeoutMs = timeoutMs;
  }

  private makeRequest(
    path: string,
    method: "GET" | "POST" = "GET",
    postData?: string,
    cookie?: string,
    extraHeaders?: Record<string, string>
  ): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; cookies: string[]; data: string }> {
    return new Promise((resolve, reject) => {
      const isHttps = this.port !== 80;
      const client = isHttps ? https : http;

      const options: https.RequestOptions = {
        hostname: this.host,
        port: this.port,
        path: path,
        method: method,
        rejectUnauthorized: false,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) InfraOpsAI-pfSenseDriver/1.0",
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
        reject(new Error(`Timeout de conexão (${this.timeoutMs}ms) ao acessar pfSense em https://${this.host}:${this.port}`));
      }, this.timeoutMs);

      const req = client.request(options, (res) => {
        clearTimeout(timer);
        let data = "";
        const setCookie: string[] = [];
        if (res.headers["set-cookie"]) {
          for (const c of res.headers["set-cookie"]) {
            setCookie.push(c.split(";")[0]);
          }
        }

        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            cookies: setCookie,
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

  public async execute(user: string, pass: string): Promise<{ success: boolean; error?: string; resource?: PfSenseResource }> {
    try {
      // 1. Fetch initial login page to get CSRF token and PHPSESSID cookie
      const initRes = await this.makeRequest("/index.php", "GET");
      const cookie = initRes.cookies.length > 0 ? initRes.cookies[0] : "";

      const csrfMatch =
        initRes.data.match(/var\s+csrfMagicToken\s*=\s*"([^"]+)";/) ||
        initRes.data.match(/name='__csrf_magic'\s+value="([^"]+)"/);
      const csrfToken = csrfMatch ? csrfMatch[1] : "";

      // 2. Post login credentials
      const postParams: Record<string, string> = {
        usernamefld: user,
        passwordfld: pass,
        login: "Sign In",
      };
      if (csrfToken) {
        postParams["__csrf_magic"] = csrfToken;
      }

      const postBody = querystring.stringify(postParams);
      const loginRes = await this.makeRequest("/index.php", "POST", postBody, cookie);

      const authCookie = loginRes.cookies.length > 0 ? loginRes.cookies[0] : cookie;

      // Check if authentication failed
      const isLoginPage =
        loginRes.data.includes("Username or Password incorrect") ||
        loginRes.data.includes("id=\"login\"") ||
        loginRes.data.includes("name=\"passwordfld\"") ||
        loginRes.data.includes("name='passwordfld'");

      // If status is 200 and still shows login form without 302 redirect, login failed!
      if (loginRes.statusCode === 200 && isLoginPage) {
        return {
          success: false,
          error: `Falha na autenticação do pfSense (usuário '${user}' ou senha incorretos na porta WebGUI ${this.port}).`,
        };
      }

      let cpuFound = false;
      let memFound = false;

      const resource: PfSenseResource = {
        cpuLoad: 0,
        usedMemoryPercent: 0,
      };

      // 3. Try fetching live AJAX stats directly via /getstats.php
      const ajaxRes = await this.makeRequest("/getstats.php", "GET", undefined, authCookie, {
        "X-Requested-With": "XMLHttpRequest",
      });

      if (ajaxRes.statusCode === 200 && ajaxRes.data && !ajaxRes.data.includes("SESSION_TIMEOUT") && !ajaxRes.data.includes("<html")) {
        const trimmed = ajaxRes.data.trim();
        const parts = trimmed.split("|");
        if (parts.length >= 2) {
          const rawCpu = parseFloat(parts[0]);
          const rawMem = parseFloat(parts[1]);
          if (!isNaN(rawCpu)) {
            resource.cpuLoad = Math.min(100, Math.max(0, Math.round(rawCpu)));
            cpuFound = true;
          }
          if (!isNaN(rawMem)) {
            resource.usedMemoryPercent = Math.min(100, Math.max(0, Math.round(rawMem)));
            memFound = true;
          }
        }
      }

      // 4. Fallback: Fetch /index.php dashboard HTML
      let statsRes = await this.makeRequest("/index.php", "GET", undefined, authCookie);

      // If statsRes still shows login page, auth session was rejected
      if (statsRes.data.includes("id=\"login\"") || statsRes.data.includes("name=\"passwordfld\"")) {
        return {
          success: false,
          error: `Sessão não autenticada no pfSense (verifique se o usuário '${user}' tem permissão de acesso à WebGUI).`,
        };
      }

      // Parse pfSense getstats output if raw pipe format (non-HTML, e.g. "5|11|...")
      const trimmedData = statsRes.data.trim();
      if (!cpuFound && !trimmedData.startsWith("<") && /^[\d\.]+\|[\d\.]+/.test(trimmedData)) {
        const parts = trimmedData.split("|");
        if (parts.length >= 2) {
          resource.cpuLoad = Math.min(100, Math.max(0, Number(parts[0]) || 0));
          resource.usedMemoryPercent = Math.min(100, Math.max(0, Number(parts[1]) || 0));
          cpuFound = true;
          memFound = true;
        }
      }

      // 1. Precise pfSense HTML Table Row parsing (isolated to <tr id="cpu"> and <tr id="memory">)
      const cpuRowMatch = statsRes.data.match(/<tr[^>]*id=["']cpu["'][\s\S]*?<\/tr>/i);
      if (cpuRowMatch) {
        const valMatch =
          cpuRowMatch[0].match(/aria-valuenow=["'](\d+)["']/i) ||
          cpuRowMatch[0].match(/style=["']width:\s*(\d+)%/i) ||
          cpuRowMatch[0].match(/>\s*(\d+)%\s*</i) ||
          cpuRowMatch[0].match(/(\d+)%/i);
        if (valMatch) {
          resource.cpuLoad = Math.min(100, Math.max(0, Number(valMatch[1])));
          cpuFound = true;
        }
      }

      const memRowMatch = statsRes.data.match(/<tr[^>]*id=["']memory["'][\s\S]*?<\/tr>/i);
      if (memRowMatch) {
        const valMatch =
          memRowMatch[0].match(/aria-valuenow=["'](\d+)["']/i) ||
          memRowMatch[0].match(/style=["']width:\s*(\d+)%/i) ||
          memRowMatch[0].match(/(\d+)%\s*of/i) ||
          memRowMatch[0].match(/>\s*(\d+)%\s*</i) ||
          memRowMatch[0].match(/(\d+)%/i);
        if (valMatch) {
          resource.usedMemoryPercent = Math.min(100, Math.max(0, Number(valMatch[1])));
          memFound = true;
        }
      }

      // 2. Fallback matching if tr id="cpu" is not present (e.g. custom pfSense themes)
      if (!cpuFound) {
        const cpuMatch =
          statsRes.data.match(/utiliza[cç][aã]o\s*do\s*cpu[\s\S]*?aria-valuenow=["'](\d+)["']/i) ||
          statsRes.data.match(/utiliza[cç][aã]o\s*do\s*cpu[\s\S]*?class=["']progress-bar[^"']*["'][\s\S]*?>\s*(\d+)%/i) ||
          statsRes.data.match(/cpu\s*usage[\s\S]*?aria-valuenow=["'](\d+)["']/i) ||
          statsRes.data.match(/id=["']cpubars["'][\s\S]*?>\s*(\d+)%/i) ||
          statsRes.data.match(/id=["']cpumeter["'][\s\S]*?width:\s*(\d+)%/i);

        if (cpuMatch) {
          resource.cpuLoad = Math.min(100, Math.max(0, Number(cpuMatch[1])));
          cpuFound = true;
        }
      }

      if (!memFound) {
        const memMatch =
          statsRes.data.match(/utiliza[cç][aã]o\s*da\s*memoria[\s\S]*?(\d+)%\s*of/i) ||
          statsRes.data.match(/memory\s*usage[\s\S]*?(\d+)%\s*of/i) ||
          statsRes.data.match(/(\d+)%\s*of\s*\d+\s*Mi?B/i);

        if (memMatch) {
          resource.usedMemoryPercent = Math.min(100, Math.max(0, Number(memMatch[1])));
          memFound = true;
        }
      }

      // Version match (supports pfSense 2.7.2-RELEASE and pfSense Plus)
      const verMatch =
        statsRes.data.match(/2\.[0-9]+\.[0-9]+-RELEASE/i) ||
        statsRes.data.match(/pfSense\s*Plus\s*[0-9\.-]+/i) ||
        statsRes.data.match(/pfSense\s*([0-9\.-]+[A-Z]*)/i);

      if (verMatch) {
        resource.version = verMatch[0].startsWith("pfSense") ? verMatch[0] : `pfSense ${verMatch[0]}`;
      }

      if (!cpuFound && !memFound) {
        return {
          success: false,
          error: `Não foi possível extrair a telemetria do pfSense (verifique se a senha do usuário '${user}' no Vault está correta).`,
        };
      }

      return {
        success: true,
        resource,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Erro de Conexão com pfSense (${this.host}:${this.port}): ${err.message}`,
      };
    }
  }
}
