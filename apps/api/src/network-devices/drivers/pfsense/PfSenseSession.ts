import querystring from "querystring";
import { PfSenseWebGuiClient } from "./PfSenseWebGuiClient";

export interface SessionAuthResult {
  success: boolean;
  cookie: string;
  csrfToken?: string;
  initialStatusCode?: number;
  postStatusCode?: number;
  error?: string;
  errorCode?: "AUTH_ERROR" | "CONNECTION_ERROR" | "CSRF_MISSING";
}

export class PfSenseSession {
  private client: PfSenseWebGuiClient;

  constructor(client: PfSenseWebGuiClient) {
    this.client = client;
  }

  public async authenticate(username: string, password: string): Promise<SessionAuthResult> {
    try {
      // Step 1: GET /index.php for CSRF token and PHPSESSID cookie
      const initRes = await this.client.makeRequest("/index.php", "GET");
      const cookie = initRes.cookies.length > 0 ? initRes.cookies[0] : "";

      const csrfMatch =
        initRes.data.match(/var\s+csrfMagicToken\s*=\s*"([^"]+)";/) ||
        initRes.data.match(/name='__csrf_magic'\s+value="([^"]+)"/) ||
        initRes.data.match(/name="__csrf_magic"\s+value="([^"]+)"/);

      const csrfToken = csrfMatch ? csrfMatch[1] : "";

      // Step 2: POST login form
      const postParams: Record<string, string> = {
        usernamefld: username,
        passwordfld: password,
        login: "Sign In",
      };
      if (csrfToken) {
        postParams["__csrf_magic"] = csrfToken;
      }

      const postBody = querystring.stringify(postParams);
      const loginRes = await this.client.makeRequest("/index.php", "POST", postBody, cookie);

      const authCookie = loginRes.cookies.length > 0 ? loginRes.cookies[0] : cookie;

      const isLoginPage =
        loginRes.data.includes("Username or Password incorrect") ||
        loginRes.data.includes("id=\"login\"") ||
        loginRes.data.includes("name=\"passwordfld\"") ||
        loginRes.data.includes("name='passwordfld'");

      // HTTP 200 with login form means credentials were rejected
      if (loginRes.statusCode === 200 && isLoginPage) {
        return {
          success: false,
          cookie: "",
          initialStatusCode: initRes.statusCode,
          postStatusCode: loginRes.statusCode,
          csrfToken,
          error: `Falha na autenticação do pfSense (usuário '${username}' ou senha incorretos na WebGUI).`,
          errorCode: "AUTH_ERROR",
        };
      }

      return {
        success: true,
        cookie: authCookie,
        csrfToken,
        initialStatusCode: initRes.statusCode,
        postStatusCode: loginRes.statusCode,
      };
    } catch (err: any) {
      return {
        success: false,
        cookie: "",
        error: `Erro de comunicação HTTP: ${err.message}`,
        errorCode: "CONNECTION_ERROR",
      };
    }
  }
}
