import * as dotenv from "dotenv";
import * as path from "path";

const env = process.env.ENV ?? "development";
dotenv.config({ path: path.resolve(process.cwd(), `.env.${env}`) });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const Config = {
  env,
  baseUrl: process.env.BASE_URL ?? "https://petstore.swagger.io/v2/",
  requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS ?? "30000"),
  responseTimeThresholdMs: parseInt(process.env.RESPONSE_TIME_THRESHOLD_MS ?? "5000"),
  retryCount: parseInt(process.env.RETRY_COUNT ?? "1"),
  workers: parseInt(process.env.WORKERS ?? "2"),
  logLevel: process.env.LOG_LEVEL ?? "info",
} as const;
