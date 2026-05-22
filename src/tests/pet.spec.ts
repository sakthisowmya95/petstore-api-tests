import { test, expect } from "../fixtures/fixtures";
import { PetFactory, PetStatus } from "../types/pet.types";
import { PetAssertions } from "../layers/assertions/pet.assertions";
import { NotFoundError } from "../layers/service/pet.service";

test.describe("POST /pet", () => {
  test(
    "creates a new pet and response matches the submitted payload",
    { tag: ["@smoke", "@regression"] },
    async ({ petService }) => {
      const payload = PetFactory.build({ name: "Buddy", status: "available" });

      const { data, statusCode, durationMs } = await petService.create(payload);

      expect(statusCode).toBe(200);
      PetAssertions.matchesPayload(data, payload);
      PetAssertions.responseTimeIsAcceptable(durationMs);
    }
  );

  test(
    "creates a pet with pending status",
    { tag: ["@regression"] },
    async ({ petService }) => {
      const payload = PetFactory.build({ status: "pending" });

      const { data, statusCode } = await petService.create(payload);

      expect(statusCode).toBe(200);
      expect(data.status).toBe("pending");
    }
  );

  test(
    "creates a pet with sold status",
    { tag: ["@regression"] },
    async ({ petService }) => {
      const payload = PetFactory.build({ status: "sold" });

      const { data, statusCode } = await petService.create(payload);

      expect(statusCode).toBe(200);
      expect(data.status).toBe("sold");
    }
  );

  test(
    "returns 405 for an invalid payload",
    { tag: ["@regression"] },
    async ({ petService }) => {
      const statusCode = await petService.tryCreate(null);

      expect(statusCode).toBe(405);
    }
  );
});

test.describe("GET /pet/{petId}", () => {
  test(
    "retrieves an existing pet by ID",
    { tag: ["@smoke", "@regression"] },
    async ({ petService, existingPet }) => {
      const { data, statusCode, durationMs } = await petService.getById(existingPet.id!);

      expect(statusCode).toBe(200);
      expect(data.id).toBe(existingPet.id);
      expect(data.name).toBe(existingPet.name);
      PetAssertions.responseTimeIsAcceptable(durationMs);
    }
  );

  test(
    "returns 404 for a non-existent pet ID",
    { tag: ["@regression"] },
    async ({ petService }) => {
      await expect(petService.getById(987_654_321_123)).rejects.toThrow(NotFoundError);
    }
  );

  test(
    "record created via POST exactly matches the GET response",
    { tag: ["@smoke", "@regression"] },
    async ({ petService }) => {
      const payload = PetFactory.build({
        name: "IntegrityPet",
        status: "sold",
        tags: [{ id: 99, name: "integrity" }],
      });

      const { data: created } = await petService.create(payload);
      const { data: fetched } = await petService.getById(created.id!);

      PetAssertions.postMatchesGet(created, fetched);
    }
  );
});

test.describe("PUT /pet", () => {
  test(
    "updates an existing pet name and status",
    { tag: ["@smoke", "@regression"] },
    async ({ petService, existingPet }) => {
      const updated = { ...existingPet, name: "UpdatedBuddy", status: "sold" as PetStatus };

      const { data, statusCode, durationMs } = await petService.update(updated);

      expect(statusCode).toBe(200);
      PetAssertions.isUpdated(data, { name: "UpdatedBuddy", status: "sold" });
      PetAssertions.responseTimeIsAcceptable(durationMs);
    }
  );

  test(
    "update is reflected when fetched via GET",
    { tag: ["@regression"] },
    async ({ petService, existingPet }) => {
      const updatedName = "ReflectedUpdate";
      await petService.update({ ...existingPet, name: updatedName });

      const { data } = await petService.getById(existingPet.id!);

      expect(data.name).toBe(updatedName);
    }
  );

  test(
    "returns 405 for an invalid payload",
    { tag: ["@regression"] },
    async ({ petService }) => {
      const statusCode = await petService.tryUpdate(null);

      expect(statusCode).toBe(405);
    }
  );
});

test.describe("DELETE /pet/{petId}", () => {
  test(
    "deletes an existing pet and returns 200",
    { tag: ["@smoke", "@regression"] },
    async ({ petService }) => {
      const { data: pet } = await petService.create(PetFactory.build());

      const { statusCode } = await petService.delete(pet.id!);

      expect(statusCode).toBe(200);
    }
  );

  test(
    "deleted pet is no longer accessible via GET",
    { tag: ["@smoke", "@regression"] },
    async ({ petService }) => {
      const { data: pet } = await petService.create(PetFactory.build());
      await petService.delete(pet.id!);

      const statusCode = await petService.tryGetById(pet.id!);

      expect(statusCode).toBe(404);
    }
  );

  test(
    "returns 404 or 405 when deleting a non-existent pet",
    { tag: ["@regression"] },
    async ({ petService }) => {
      const statusCode = await petService.tryDelete(999_888_777);

      PetAssertions.statusIsOneOf(statusCode, [404, 405]);
    }
  );
});

test.describe("GET /pet/findByStatus", () => {
  const statuses: PetStatus[] = ["available", "pending", "sold"];

  for (const status of statuses) {
    test(
      `returns only ${status} pets`,
      { tag: ["@smoke", "@regression"] },
      async ({ petService }) => {
        const { data, statusCode, durationMs } = await petService.findByStatus(status);

        expect(statusCode).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        data
          .filter((pet) => pet.status !== undefined)
          .forEach((pet) => expect(pet.status).toBe(status));
        PetAssertions.responseTimeIsAcceptable(durationMs);
      }
    );
  }
});
