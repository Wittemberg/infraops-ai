import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from "fs";
import { dirname } from "path";
import { AppError } from "@infraops/shared";

export interface StoredSecret {
  id: string;
  tenantId: string;
  name: string;
  type: "api_key" | "password" | "token" | "ssh_key";
  ciphertext: string; // Base64 ciphertext + auth tag
  nonce: string;      // Base64 12-byte IV
  keyVersion: number;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface SecretMetadataResponse {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  keyVersion: number;
  createdAt: Date;
  lastUsedAt?: Date;
}

export class SecretVaultService {
  private masterKey: Buffer;
  private secretsStore: Map<string, StoredSecret> = new Map();
  private storageFilePath?: string;

  constructor(masterKeyHex: string, storageFilePath?: string) {
    const isProd = process.env.NODE_ENV === "production";
    if (isProd && (!masterKeyHex || masterKeyHex.includes("master_key_1234567890"))) {
      throw new Error("[SECURITY_FATAL] ENCRYPTION_MASTER_KEY environment variable is required in production environment!");
    }

    if (!masterKeyHex || masterKeyHex.length < 32) {
      throw new Error("[SECURITY_FATAL] Encryption Master Key must be at least 32 characters long");
    }
    // Pad or trim master key to 32 bytes (256 bits) for AES-256
    const keyBuf = Buffer.from(masterKeyHex, "utf8");
    this.masterKey = Buffer.alloc(32);
    keyBuf.copy(this.masterKey, 0, 0, Math.min(keyBuf.length, 32));

    this.storageFilePath = storageFilePath;
    this.loadFromDisk();
  }

  private loadFromDisk() {
    if (!this.storageFilePath) return;
    try {
      if (existsSync(this.storageFilePath)) {
        const raw = readFileSync(this.storageFilePath, "utf-8");
        const list: StoredSecret[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const item of list) {
            this.secretsStore.set(item.id, item);
          }
        }
      }
    } catch (e) {
      console.error("[Vault] Error loading persistent secrets from disk:", e);
    }
  }

  private saveToDisk() {
    if (!this.storageFilePath) return;
    try {
      const dir = dirname(this.storageFilePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.secretsStore.values());
      const tmpFile = `${this.storageFilePath}.tmp`;
      writeFileSync(tmpFile, JSON.stringify(list, null, 2), "utf-8");
      renameSync(tmpFile, this.storageFilePath);
    } catch (e) {
      console.error("[Vault] Error saving persistent secrets to disk:", e);
    }
  }

  public storeSecret(tenantId: string, name: string, type: "api_key" | "password" | "token" | "ssh_key", plaintext: string): SecretMetadataResponse {
    const nonceBuf = randomBytes(12); // 96-bit nonce for AES-GCM
    const cipher = createCipheriv("aes-256-gcm", this.masterKey, nonceBuf);

    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");
    const authTag = cipher.getAuthTag().toString("base64");

    const combinedCiphertext = `${encrypted}.${authTag}`;
    const secretId = `sec-${Math.random().toString(36).substring(2, 10)}`;

    const stored: StoredSecret = {
      id: secretId,
      tenantId,
      name,
      type,
      ciphertext: combinedCiphertext,
      nonce: nonceBuf.toString("base64"),
      keyVersion: 1,
      createdAt: new Date(),
    };

    this.secretsStore.set(secretId, stored);
    this.saveToDisk();

    return {
      id: stored.id,
      tenantId: stored.tenantId,
      name: stored.name,
      type: stored.type,
      keyVersion: stored.keyVersion,
      createdAt: stored.createdAt,
    };
  }

  public decryptSecretInternal(secretId: string, tenantId: string): string {
    const secret = this.secretsStore.get(secretId);

    if (!secret || secret.tenantId !== tenantId) {
      throw new AppError("SECRET_NOT_FOUND", `Secret '${secretId}' not found for tenant '${tenantId}'`, 404);
    }

    const nonceBuf = Buffer.from(secret.nonce, "base64");
    const parts = secret.ciphertext.split(".");
    if (parts.length !== 2) {
      throw new AppError("SECRET_CORRUPTED", "Invalid ciphertext format", 500);
    }

    const [encryptedText, authTagText] = parts;
    const decipher = createDecipheriv("aes-256-gcm", this.masterKey, nonceBuf);
    decipher.setAuthTag(Buffer.from(authTagText, "base64"));

    let decrypted = decipher.update(encryptedText, "base64", "utf8");
    decrypted += decipher.final("utf8");

    secret.lastUsedAt = new Date();
    return decrypted;
  }

  public getSecretMetadata(secretId: string, tenantId: string): SecretMetadataResponse {
    const secret = this.secretsStore.get(secretId);

    if (!secret || secret.tenantId !== tenantId) {
      throw new AppError("SECRET_NOT_FOUND", `Secret '${secretId}' not found for tenant '${tenantId}'`, 404);
    }

    return {
      id: secret.id,
      tenantId: secret.tenantId,
      name: secret.name,
      type: secret.type,
      keyVersion: secret.keyVersion,
      createdAt: secret.createdAt,
      lastUsedAt: secret.lastUsedAt,
    };
  }

  // Returns database raw representation (verifying plaintext is never present)
  public getRawStoredSecret(secretId: string): StoredSecret | undefined {
    return this.secretsStore.get(secretId);
  }
}
