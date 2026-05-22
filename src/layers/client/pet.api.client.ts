import { APIResponse } from "@playwright/test";
import { HttpClient } from "../../core/http/http.client";
import { Pet } from "../../types/pet.types";

export class PetApiClient {
  constructor(private readonly http: HttpClient) {}

  addPet(pet: Pet | null): Promise<APIResponse> {
    return this.http.post("pet", pet);
  }

  updatePet(pet: Pet | null): Promise<APIResponse> {
    return this.http.put("pet", pet);
  }

  getPetById(id: number): Promise<APIResponse> {
    return this.http.get(`pet/${id}`);
  }

  findByStatus(status: string): Promise<APIResponse> {
    return this.http.get("pet/findByStatus", { status });
  }

  deletePet(id: number, apiKey = "special-key"): Promise<APIResponse> {
    return this.http.delete(`pet/${id}`, { api_key: apiKey });
  }
}
