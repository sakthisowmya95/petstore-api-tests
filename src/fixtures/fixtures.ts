import { test as base, APIRequestContext, expect } from "@playwright/test";
import { HttpClient } from "../core/http/http.client";
import { PetApiClient } from "../layers/client/pet.api.client";
import { PetService } from "../layers/service/pet.service";
import { Pet, PetFactory } from "../types/pet.types";
import { Logger } from "../core/logger/logger";

export { expect };

const log = new Logger("Fixtures");

export type Fixtures = {
  petService: PetService;
  existingPet: Pet;
};

export const test = base.extend<Fixtures>({
  petService: async (
    { request }: { request: APIRequestContext },
    use: (s: PetService) => Promise<void>
  ) => {
    const http = new HttpClient(request);
    const client = new PetApiClient(http);
    const service = new PetService(client, () => http.lastDurationMs());
    await use(service);
    await service.cleanup();
  },

  existingPet: async (
    { petService }: { petService: PetService },
    use: (p: Pet) => Promise<void>
  ) => {
    const payload = PetFactory.build({ name: "FixturePet", status: "available" });
    const { data } = await petService.create(payload);
    log.info("existingPet fixture ready", { id: data.id });
    await use(data);
  },
});
