import { AppEnv } from "./enums.js";

export interface AppConfig {
  appEnv: AppEnv;
  appBaseUrl: string;
  databaseUrl: string;
  redisUrl: string;
  prometheusUrl?: string;
  s3Endpoint?: string;
  s3Region?: string;
  s3Bucket?: string;
  s3AccessKey?: string;
  s3SecretKey?: string;
  encryptionMasterKey: string;
  jwtSecret: string;
  aiProvider?: string;
  aiModel?: string;
}

export function validateEnvironment(env: Record<string, string | undefined> = process.env): AppConfig {
  const missing: string[] = [];

  const appEnv = (env.APP_ENV || "development") as AppEnv;
  const appBaseUrl = env.APP_BASE_URL || "http://localhost:3000";
  const databaseUrl = env.DATABASE_URL;
  const redisUrl = env.REDIS_URL;
  const encryptionMasterKey = env.ENCRYPTION_MASTER_KEY;
  const jwtSecret = env.JWT_SECRET;

  if (!databaseUrl) missing.push("DATABASE_URL");
  if (!redisUrl) missing.push("REDIS_URL");
  if (!encryptionMasterKey) missing.push("ENCRYPTION_MASTER_KEY");
  if (!jwtSecret) missing.push("JWT_SECRET");

  if (missing.length > 0) {
    throw new Error(`[CONFIG_FATAL] Missing required environment variables: ${missing.join(", ")}`);
  }

  if (appEnv === AppEnv.PRODUCTION && encryptionMasterKey!.length < 32) {
    throw new Error("[CONFIG_FATAL] ENCRYPTION_MASTER_KEY must be at least 32 characters long in production.");
  }

  return {
    appEnv,
    appBaseUrl,
    databaseUrl: databaseUrl!,
    redisUrl: redisUrl!,
    prometheusUrl: env.PROMETHEUS_URL,
    s3Endpoint: env.S3_ENDPOINT,
    s3Region: env.S3_REGION,
    s3Bucket: env.S3_BUCKET,
    s3AccessKey: env.S3_ACCESS_KEY,
    s3SecretKey: env.S3_SECRET_KEY,
    encryptionMasterKey: encryptionMasterKey!,
    jwtSecret: jwtSecret!,
    aiProvider: env.AI_PROVIDER,
    aiModel: env.AI_MODEL,
  };
}
