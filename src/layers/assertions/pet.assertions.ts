import { expect } from "@playwright/test";
import { Pet } from "../../types/pet.types";
import { Config } from "../../core/config/config";
import { Logger } from "../../core/logger/logger";

const log = new Logger("PetAssertions");

export class PetAssertions {
  static matchesPayload(actual: Pet, expected: Pet): void {
    log.debug("Asserting pet matches payload", { id: actual.id });
    expect(actual.id).toBeDefined();
    expect(actual.name).toBe(expected.name);
    expect(actual.status).toBe(expected.status);
    expect(actual.photoUrls).toEqual(expected.photoUrls);
    expect(actual.category?.name).toBe(expected.category?.name);
    if (expected.tags?.length) {
      expect(actual.tags?.[0]?.name).toBe(expected.tags[0].name);
    }
  }

  static postMatchesGet(created: Pet, fetched: Pet): void {
    log.debug("Asserting POST matches GET", { id: created.id });
    expect(fetched.id).toBe(created.id);
    expect(fetched.name).toBe(created.name);
    expect(fetched.status).toBe(created.status);
    expect(fetched.photoUrls).toEqual(created.photoUrls);
    expect(fetched.category?.name).toBe(created.category?.name);
    expect(fetched.tags?.[0]?.name).toBe(created.tags?.[0]?.name);
  }

  static isUpdated(actual: Pet, expected: Partial<Pet>): void {
    if (expected.name !== undefined) expect(actual.name).toBe(expected.name);
    if (expected.status !== undefined) expect(actual.status).toBe(expected.status);
  }

  static responseTimeIsAcceptable(durationMs: number): void {
    expect(
      durationMs,
      `Response time ${durationMs}ms exceeded threshold ${Config.responseTimeThresholdMs}ms`
    ).toBeLessThanOrEqual(Config.responseTimeThresholdMs);
  }

  static statusIsOneOf(actual: number, expected: number[]): void {
    expect(expected, `Expected status one of ${expected.join(", ")}, got ${actual}`).toContain(actual);
  }
}
