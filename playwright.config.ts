import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import * as path from "path";

const env = process.env.ENV ?? "development";
dotenv.config({ path: path.resolve(__dirname, `.env.${env}`) });
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  testDir: "./src/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : parseInt(process.env.RETRY_COUNT ?? "1"),
  workers: process.env.CI ? 4 : parseInt(process.env.WORKERS ?? "2"),
  timeout: parseInt(process.env.REQUEST_TIMEOUT_MS ?? "30000"),

  reporter: [
    ["./src/core/reporter/suite.reporter.ts"],
    ["html", { outputFolder: "reports/html", open: "never" }],
    ["json", { outputFile: "reports/json/results.json" }],
    ["junit", { outputFile: "reports/junit/results.xml" }],
    ["allure-playwright", { outputFolder: "reports/allure-results" }],
  ],

  use: {
    baseURL: process.env.BASE_URL ?? "https://petstore.swagger.io/v2/",
    extraHTTPHeaders: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    trace: "on-first-retry",
  },

  globalTeardown: "./src/hooks/global.teardown.ts",

  projects: [
    {
      name: "full-suite",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "smoke",
      use: { ...devices["Desktop Chrome"] },
      grep: /@smoke/,
    },
    {
      name: "regression",
      use: { ...devices["Desktop Chrome"] },
      grep: /@regression/,
    },
  ],
});
