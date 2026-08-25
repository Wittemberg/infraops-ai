import net from "net";
import crypto from "crypto";

export interface MikroTikResource {
  uptime?: string;
  version?: string;
  freeMemory?: number;
  totalMemory?: number;
  cpuLoad?: number;
  boardName?: string;
  architectureName?: string;
}

export class MikroTikApiClient {
  private host: string;
  private port: number;
  private timeoutMs: number;

  constructor(host: string, port: number = 8728, timeoutMs: number = 6000) {
    this.host = host;
    this.port = port;
    this.timeoutMs = timeoutMs;
  }

  private encodeString(str: string): Buffer {
    const buf = Buffer.from(str, "utf8");
    const len = buf.length;
    let lenBuf: Buffer;

    if (len < 0x80) {
      lenBuf = Buffer.from([len]);
    } else if (len < 0x4000) {
      const b1 = (len >> 8) | 0x80;
      const b2 = len & 0xff;
      lenBuf = Buffer.from([b1, b2]);
    } else if (len < 0x200000) {
      const b1 = (len >> 16) | 0xc0;
      const b2 = (len >> 8) & 0xff;
      const b3 = len & 0xff;
      lenBuf = Buffer.from([b1, b2, b3]);
    } else {
      const b1 = (len >> 24) | 0xe0;
      const b2 = (len >> 16) & 0xff;
      const b3 = (len >> 8) & 0xff;
      const b4 = len & 0xff;
      lenBuf = Buffer.from([b1, b2, b3, b4]);
    }

    return Buffer.concat([lenBuf, buf]);
  }

  private encodeSentence(words: string[]): Buffer {
    const buffers = words.map((w) => this.encodeString(w));
    buffers.push(Buffer.from([0x00])); // terminate sentence
    return Buffer.concat(buffers);
  }

  private decodeSentences(data: Buffer): string[][] {
    const sentences: string[][] = [];
    let currentSentence: string[] = [];
    let offset = 0;

    while (offset < data.length) {
      let b = data[offset++];
      let len = 0;
      if ((b & 0x80) === 0) {
        len = b;
      } else if ((b & 0xc0) === 0x80) {
        if (offset >= data.length) break;
        len = ((b & 0x3f) << 8) | data[offset++];
      } else if ((b & 0xe0) === 0xc0) {
        if (offset + 1 >= data.length) break;
        len = ((b & 0x1f) << 16) | (data[offset++] << 8) | data[offset++];
      } else if ((b & 0xf0) === 0xe0) {
        if (offset + 2 >= data.length) break;
        len = ((b & 0x0f) << 24) | (data[offset++] << 16) | (data[offset++] << 8) | data[offset++];
      }

      if (len === 0) {
        if (currentSentence.length > 0) {
          sentences.push(currentSentence);
          currentSentence = [];
        }
        continue;
      }

      if (offset + len > data.length) {
        // Incomplete word buffer, break and await next chunk
        break;
      }

      const word = data.slice(offset, offset + len).toString("utf8");
      offset += len;
      currentSentence.push(word);
    }

    return sentences;
  }

  public async execute(user: string, pass: string): Promise<{ success: boolean; error?: string; resource?: MikroTikResource }> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let buffer = Buffer.alloc(0);
      let step: "init" | "challenge" | "resource" | "done" = "init";
      let resolved = false;

      const finish = (result: { success: boolean; error?: string; resource?: MikroTikResource }) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          socket.destroy();
          resolve(result);
        }
      };

      const timer = setTimeout(() => {
        finish({ success: false, error: `Timeout de conexão (${this.timeoutMs}ms) ao conectar na porta API de ${this.host}:${this.port}` });
      }, this.timeoutMs);

      socket.connect(this.port, this.host, () => {
        // Send initial login command: /login
        const loginCmd = this.encodeSentence(["/login", `=name=${user}`, `=password=${pass}`]);
        socket.write(loginCmd);
      });

      socket.on("data", (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        const sentences = this.decodeSentences(buffer);

        for (const s of sentences) {
          const replyType = s[0];

          if (replyType === "!trap") {
            const errWord = s.find((w) => w.startsWith("=message="));
            const msg = errWord ? errWord.replace("=message=", "") : "Falha de autenticação no RouterOS (usuário ou senha incorretos)";
            return finish({ success: false, error: msg });
          }

          if (replyType === "!done") {
            const retWord = s.find((w) => w.startsWith("=ret="));
            if (retWord && step === "init") {
              // Legacy RouterOS v6 challenge response auth
              const challengeHex = retWord.replace("=ret=", "");
              step = "challenge";
              const md5 = crypto.createHash("md5");
              const passBuf = Buffer.from(pass, "utf8");
              const chalBuf = Buffer.from(challengeHex, "hex");
              md5.update(Buffer.from([0x00]));
              md5.update(passBuf);
              md5.update(chalBuf);
              const responseHex = `00${md5.digest("hex")}`;

              const chalCmd = this.encodeSentence(["/login", `=name=${user}`, `=response=${responseHex}`]);
              buffer = Buffer.alloc(0);
              socket.write(chalCmd);
              return;
            }

            if (step === "init" || step === "challenge") {
              // Authenticated! Now query /system/resource/print
              step = "resource";
              buffer = Buffer.alloc(0);
              const resCmd = this.encodeSentence(["/system/resource/print"]);
              socket.write(resCmd);
              return;
            }
          }

          if (replyType === "!re" && step === "resource") {
            const resource: MikroTikResource = {};
            for (const word of s) {
              if (word.startsWith("=free-memory=")) resource.freeMemory = Number(word.replace("=free-memory=", ""));
              if (word.startsWith("=total-memory=")) resource.totalMemory = Number(word.replace("=total-memory=", ""));
              if (word.startsWith("=cpu-load=")) resource.cpuLoad = Number(word.replace("=cpu-load=", ""));
              if (word.startsWith("=uptime=")) resource.uptime = word.replace("=uptime=", "");
              if (word.startsWith("=version=")) resource.version = word.replace("=version=", "");
              if (word.startsWith("=board-name=")) resource.boardName = word.replace("=board-name=", "");
            }

            return finish({ success: true, resource });
          }
        }
      });

      socket.on("error", (err) => {
        finish({ success: false, error: `Erro de Conexão TCP (${this.host}:${this.port}): ${err.message}` });
      });

      socket.on("close", () => {
        if (!resolved) {
          finish({ success: false, error: `Conexão encerrada pelo equipamento (${this.host}:${this.port})` });
        }
      });
    });
  }
}
