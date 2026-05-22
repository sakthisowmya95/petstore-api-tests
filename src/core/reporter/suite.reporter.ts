import type { Reporter, FullConfig, Suite, TestCase, TestResult, FullResult } from "@playwright/test/reporter";
import * as fs from "fs";
import * as path from "path";
import { Config } from "../config/config";

interface TestRecord {
  title: string;
  suite: string;
  status: string;
  durationMs: number;
  retries: number;
  error?: string;
}

export default class SuiteReporter implements Reporter {
  private records: TestRecord[] = [];
  private startTime = 0;

  onBegin(_config: FullConfig, suite: Suite): void {
    this.startTime = Date.now();
    console.log("\n" + "═".repeat(60));
    console.log("  🧪  PETSTORE API TEST SUITE");
    console.log("═".repeat(60));
    console.log(`  Environment : ${Config.env.toUpperCase()}`);
    console.log(`  Base URL    : ${Config.baseUrl}`);
    console.log(`  Tests       : ${suite.allTests().length}`);
    console.log(`  Workers     : ${Config.workers}`);
    console.log(`  Threshold   : ${Config.responseTimeThresholdMs}ms`);
    console.log("═".repeat(60) + "\n");
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const icon = result.status === "passed" ? "✅" : result.status === "failed" ? "❌" : "⏭️";
    const retry = result.retry > 0 ? ` (retry #${result.retry})` : "";
    console.log(`  ${icon} ${test.title}${retry} — ${result.duration}ms`);
    if (result.status === "failed" && result.error?.message) {
      console.log(`      ↳ ${result.error.message.split("\n")[0]}`);
    }
    this.records.push({
      title: test.title,
      suite: test.parent?.title ?? "",
      status: result.status,
      durationMs: result.duration,
      retries: result.retry,
      error: result.error?.message,
    });
  }

  onEnd(result: FullResult): void {
    const totalMs = Date.now() - this.startTime;
    const passed  = this.records.filter((r) => r.status === "passed").length;
    const failed  = this.records.filter((r) => r.status === "failed").length;
    const flaky   = this.records.filter((r) => r.retries > 0 && r.status === "passed").length;
    const durations = this.records.map((r) => r.durationMs);
    const avgMs = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const maxMs = durations.length ? Math.max(...durations) : 0;
    const slowest = this.records.find((r) => r.durationMs === maxMs);

    console.log("\n" + "═".repeat(60));
    console.log("  📊  RUN SUMMARY");
    console.log("═".repeat(60));
    console.log(`  Status      : ${result.status === "passed" ? "✅ PASSED" : "❌ FAILED"}`);
    console.log(`  Total       : ${this.records.length}`);
    console.log(`  Passed      : ${passed}`);
    console.log(`  Failed      : ${failed}`);
    console.log(`  Flaky       : ${flaky}`);
    console.log(`  Avg Time    : ${avgMs}ms`);
    console.log(`  Slowest     : ${slowest?.title ?? "—"} (${maxMs}ms)`);
    console.log(`  Total Time  : ${(totalMs / 1000).toFixed(2)}s`);

    if (failed > 0) {
      console.log("\n  ❌ Failures:");
      this.records.filter((r) => r.status === "failed")
        .forEach((r) => console.log(`     • [${r.suite}] ${r.title}`));
    }
    console.log("═".repeat(60) + "\n");

    const outDir = path.resolve(process.cwd(), "reports/summary");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, `run-${new Date().toISOString().replace(/[:.]/g, "-")}.json`),
      JSON.stringify({
        runAt: new Date().toISOString(),
        environment: Config.env,
        baseUrl: Config.baseUrl,
        result: result.status,
        summary: { total: this.records.length, passed, failed, flaky, avgMs, totalMs },
        tests: this.records,
      }, null, 2)
    );
  }
}
