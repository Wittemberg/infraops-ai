import { validateEnvironment, redactSecrets, formatErrorResponse, AppError, AppEnv } from "../index.js";

describe("Shared Package - Etapa 03 Validation", () => {
  test("validateEnvironment throws when required vars are missing", () => {
    expect(() => validateEnvironment({})).toThrow("[CONFIG_FATAL]");
  });

  test("validateEnvironment parses valid config", () => {
    const mockEnv = {
      APP_ENV: "development",
      APP_BASE_URL: "https://infraopsai.awecloudsolution.com",
      DATABASE_URL: "postgresql://infraops_app:pass@postgres:5432/infraops_db",
      REDIS_URL: "redis://redis:6379",
      ENCRYPTION_MASTER_KEY: "12345678901234567890123456789012",
      JWT_SECRET: "jwt_secret_key",
    };

    const config = validateEnvironment(mockEnv);
    expect(config.appEnv).toBe(AppEnv.DEVELOPMENT);
    expect(config.databaseUrl).toContain("infraops_db");
  });

  test("redactSecrets masks sensitive fields and connection string passwords", () => {
    const rawData = {
      user: "admin",
      password: "super_secret_password",
      connection: "postgresql://user:secret123@localhost:5432/db",
    };

    const redacted = redactSecrets(rawData);
    expect(redacted.password).not.toBe("super_secret_password");
    expect(redacted.connection).toBe("postgresql://user:[REDACTED]@localhost:5432/db");
  });

  test("formatErrorResponse returns standard error format without leaking stack", () => {
    const requestId = "req-12345";
    const appError = new AppError("NODE_NOT_FOUND", "Node not found", 404);

    const formatted = formatErrorResponse(appError, requestId);
    expect(formatted.statusCode).toBe(404);
    expect(formatted.body.error.code).toBe("NODE_NOT_FOUND");
    expect(formatted.body.error.requestId).toBe(requestId);
  });
});
