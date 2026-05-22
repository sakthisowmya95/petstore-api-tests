import * as fs from "fs";
import * as path from "path";
import { Config } from "../config/config";

type LogLevel = "debug" | "info" | "warn" | "error";
const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

const logDir = path.resolve(process.cwd(), "reports/logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, `run-${new Date().toISOString().replace(/[:.]/g, "-")}.log`);

function write(level: LogLevel, context: string, message: string, data?: unknown): void {
  if (LEVELS[level] < LEVELS[Config.logLevel as LogLevel]) return;
  const ts = new Date().toISOString();
  const line = data
    ? `[${ts}] [${level.toUpperCase()}] [${context}] ${message}\n${JSON.stringify(data, null, 2)}`
    : `[${ts}] [${level.toUpperCase()}] [${context}] ${message}`;
  ({ debug: console.debug, info: console.info, warn: console.warn, error: console.error }[level])(line);
  fs.appendFileSync(logFile, line + "\n");
}

export class Logger {
  constructor(private readonly context: string) {}
  debug(msg: string, data?: unknown) { write("debug", this.context, msg, data); }
  info(msg: string, data?: unknown)  { write("info",  this.context, msg, data); }
  warn(msg: string, data?: unknown)  { write("warn",  this.context, msg, data); }
  error(msg: string, data?: unknown) { write("error", this.context, msg, data); }
}
