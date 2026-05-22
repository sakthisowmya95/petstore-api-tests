import { PetApiClient } from "../client/pet.api.client";
import { Pet, PetStatus } from "../../types/pet.types";
import { PetSchema } from "../../core/schema/pet.schema";
import { Logger } from "../../core/logger/logger";

const log = new Logger("PetService");

export interface ServiceResponse<T> {
  data: T;
  statusCode: number;
  durationMs: number;
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class PetService {
  private readonly createdIds: number[] = [];

  constructor(
    private readonly client: PetApiClient,
    private readonly lastDuration: () => number
  ) {}

  async create(pet: Pet): Promise<ServiceResponse<Pet>> {
    log.info("Creating pet", { name: pet.name, status: pet.status });
    const response = await this.client.addPet(pet);
    const statusCode = response.status();

    if (!response.ok()) {
      throw new Error(`Failed to create pet — HTTP ${statusCode}`);
    }

    const raw = await response.json();
    const data = PetSchema.parse(raw) as Pet;

    if (data.id) this.createdIds.push(data.id);
    log.info("Pet created", { id: data.id });

    return { data, statusCode, durationMs: this.lastDuration() };
  }

  async update(pet: Pet): Promise<ServiceResponse<Pet>> {
    log.info("Updating pet", { id: pet.id, name: pet.name });
    const response = await this.client.updatePet(pet);
    const statusCode = response.status();

    if (!response.ok()) {
      throw new Error(`Failed to update pet — HTTP ${statusCode}`);
    }

    const raw = await response.json();
    const data = PetSchema.parse(raw) as Pet;
    return { data, statusCode, durationMs: this.lastDuration() };
  }

  async getById(id: number): Promise<ServiceResponse<Pet>> {
    log.info("Fetching pet", { id });
    const response = await this.client.getPetById(id);
    const statusCode = response.status();

    if (statusCode === 404) {
      throw new NotFoundError(`Pet with id ${id} not found`);
    }

    const raw = await response.json();
    const data = PetSchema.parse(raw) as Pet;
    return { data, statusCode, durationMs: this.lastDuration() };
  }

  async findByStatus(status: PetStatus): Promise<ServiceResponse<Pet[]>> {
    log.info("Finding pets by status", { status });
    const response = await this.client.findByStatus(status);
    const statusCode = response.status();

    if (!response.ok()) {
      throw new Error(`Failed to find pets by status — HTTP ${statusCode}`);
    }

    const raw: unknown[] = await response.json();

    const data: Pet[] = (Array.isArray(raw) ? raw : [])
      .filter((item): item is Record<string, unknown> =>
        item !== null && typeof item === "object"
      )
      .map((item) => ({
        id: typeof item["id"] === "number" ? item["id"] : undefined,
        name: typeof item["name"] === "string" ? item["name"] : "",
        photoUrls: Array.isArray(item["photoUrls"])
          ? (item["photoUrls"] as string[])
          : [],
        category: item["category"] as Pet["category"] | undefined,
        tags: item["tags"] as Pet["tags"] | undefined,
        status:
          item["status"] === "available" ||
          item["status"] === "pending" ||
          item["status"] === "sold"
            ? (item["status"] as PetStatus)
            : undefined,
      }));

    return { data, statusCode, durationMs: this.lastDuration() };
  }

  async delete(id: number): Promise<ServiceResponse<void>> {
    log.info("Deleting pet", { id });
    const response = await this.client.deletePet(id);
    const statusCode = response.status();
    const idx = this.createdIds.indexOf(id);
    if (idx > -1) this.createdIds.splice(idx, 1);
    return { data: undefined, statusCode, durationMs: this.lastDuration() };
  }

  async tryGetById(id: number): Promise<number> {
    const response = await this.client.getPetById(id);
    return response.status();
  }

  async tryDelete(id: number): Promise<number> {
    const response = await this.client.deletePet(id);
    return response.status();
  }

  async tryCreate(pet: null): Promise<number> {
    const response = await this.client.addPet(pet);
    return response.status();
  }

  async tryUpdate(pet: null): Promise<number> {
    const response = await this.client.updatePet(pet);
    return response.status();
  }

  async cleanup(): Promise<void> {
    for (const id of [...this.createdIds]) {
      try {
        await this.client.deletePet(id);
        log.info("Cleanup: deleted pet", { id });
      } catch {
        log.warn("Cleanup: could not delete pet", { id });
      }
    }
    this.createdIds.length = 0;
  }
}
