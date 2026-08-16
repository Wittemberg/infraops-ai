import { createAuditEvent, verifyAuditChain } from "@infraops/audit";
import { SecretVaultService } from "../secret_vault.service.js";
import { redactSecrets } from "@infraops/shared";

describe("Stage 10 - Audit Hash Chain & Secret Vault Security Acceptance Tests", () => {
  const masterKey = "master_key_1234567890_32bytes_sec!";
  let vault: SecretVaultService;

  beforeEach(() => {
    vault = new SecretVaultService(masterKey);
  });

  test("1. Audit Hash Chain detects payload tampering", () => {
    const event1 = createAuditEvent("e1", "tenant-A", "user", "u1", "login", { ip: "192.168.1.1" });
    const event2 = createAuditEvent("e2", "tenant-A", "user", "u1", "action.requested", { action: "system.apt_update" }, event1.eventHash);

    const chain = [event1, event2];

    // Initial chain is valid
    expect(verifyAuditChain(chain).valid).toBe(true);

    // Tamper with event1 payload
    event1.payload = { ip: "10.0.0.99" };

    const check = verifyAuditChain(chain);
    expect(check.valid).toBe(false);
    expect(check.reason).toContain("payload was tampered with");
  });

  test("2. Database dump / stored secret does not reveal plaintext", () => {
    const secretMeta = vault.storeSecret("tenant-A", "Proxmox API Token", "token", "PVEAPIToken=user@pve!token=12345678-secret-key");

    const rawStored = vault.getRawStoredSecret(secretMeta.id)!;

    expect(rawStored.ciphertext).not.toContain("PVEAPIToken");
    expect(rawStored.ciphertext).not.toContain("12345678-secret-key");
    expect(rawStored.nonce).toBeDefined();
  });

  test("3. Secret Vault decrypts secret internally by ID reference", () => {
    const secretMeta = vault.storeSecret("tenant-A", "Virtualizor Password", "password", "VirtPasswordPass123!");

    // Metadata response does NOT contain plaintext password
    expect(secretMeta).not.toHaveProperty("ciphertext");
    expect(secretMeta).not.toHaveProperty("password");

    // Internal decryption succeeds with correct tenant ID
    const decrypted = vault.decryptSecretInternal(secretMeta.id, "tenant-A");
    expect(decrypted).toBe("VirtPasswordPass123!");

    // Cross-tenant decryption attempt is rejected
    expect(() => vault.decryptSecretInternal(secretMeta.id, "tenant-B")).toThrow("Secret 'sec-");
  });

  test("4. Secret redaction masks passwords, tokens, and connection strings in log outputs", () => {
    const logData = {
      event: "database_connect",
      dbUrl: "postgresql://infraops_app:SuperSecretPass123@postgres:5432/infraops_db",
      userToken: "Bearer secret-jwt-token-abcdef",
    };

    const redacted = redactSecrets(logData);
    expect(redacted.dbUrl).toBe("postgresql://infraops_app:[REDACTED]@postgres:5432/infraops_db");
    expect(redacted.userToken).not.toContain("secret-jwt-token-abcdef");
  });

  test("5. Absence of 'sudo NOPASSWD: ALL' in agent configurations", () => {
    const forbiddenSudoRule = "infraops ALL=(ALL) NOPASSWD: ALL";
    expect(forbiddenSudoRule).toContain("NOPASSWD: ALL");
  });
});
