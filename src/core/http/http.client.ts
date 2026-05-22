import { APIRequestContext, APIResponse } from "@playwright/test";
import { Logger } from "../logger/logger";
import { Config } from "../config/config";

const log = new Logger("HttpClient");

export interface RequestMetric {
  method: string;
  url: string;
  statusCode: number;
  durationMs: number;
  withinThreshold: boolean;
}

export class HttpClient {
  readonly metrics: RequestMetric[] = [];

  constructor(private readonly request: APIRequestContext) {}

  private async send(method: string, url: string, fn: () => Promise<APIResponse>): Promise<APIResponse> {
    const start = Date.now();
    log.debug(`→ ${method} ${url}`);
    const response = await fn();
    const durationMs = Date.now() - start;
    const statusCode = response.status();
    const withinThreshold = durationMs <= Config.responseTimeThresholdMs;
    log.info(`← ${method} ${url} | ${statusCode} | ${durationMs}ms`);
    if (!withinThreshold) {
      log.warn(`Slow response: ${method} ${url} took ${durationMs}ms`);
    }
    this.metrics.push({ method, url, statusCode, durationMs, withinThreshold });
    return response;
  }

  get(url: string, params?: Record<string, string>): Promise<APIResponse> {
    return this.send("GET", url, () => this.request.get(url, { params }));
  }

  post(url: string, data: unknown): Promise<APIResponse> {
    return this.send("POST", url, () => this.request.post(url, { data }));
  }

  put(url: string, data: unknown): Promise<APIResponse> {
    return this.send("PUT", url, () => this.request.put(url, { data }));
  }

  delete(url: string, headers?: Record<string, string>): Promise<APIResponse> {
    return this.send("DELETE", url, () => this.request.delete(url, { headers }));
  }

  lastDurationMs(): number {
    return this.metrics[this.metrics.length - 1]?.durationMs ?? 0;
  }
}
