import * as fs from "fs";
import * as path from "path";

export default async function globalTeardown(): Promise<void> {
  const dir = path.resolve(process.cwd(), "reports/metrics");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "teardown.json"),
    JSON.stringify({ completedAt: new Date().toISOString(), environment: process.env.ENV ?? "development" }, null, 2)
  );
}
