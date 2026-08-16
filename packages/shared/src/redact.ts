const SENSITIVE_KEYS = [
  "password",
  "secret",
  "token",
  "authorization",
  "jwt",
  "key",
  "encryption_master_key",
  "s3_secret_key",
  "postgres_password",
  "private_key",
];

export function maskString(value: string, visibleChars = 4): string {
  if (!value) return "";
  if (value.length <= visibleChars * 2) return "*****";
  return `${value.substring(0, visibleChars)}...${value.substring(value.length - visibleChars)}`;
}

export function redactSecrets<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    // Check for postgres connection string password masking
    return data.replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi, "$1[REDACTED]$3") as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSecrets(item)) as unknown as T;
  }

  if (typeof data === "object") {
    const redactedObj: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) => lowerKey.includes(sensitiveKey));

      if (isSensitive && typeof value === "string") {
        redactedObj[key] = maskString(value);
      } else if (typeof value === "object" && value !== null) {
        redactedObj[key] = redactSecrets(value);
      } else {
        redactedObj[key] = value;
      }
    }

    return redactedObj as T;
  }

  return data;
}
