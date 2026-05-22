export type PetStatus = "available" | "pending" | "sold";

export interface Category {
  id: number;
  name: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Pet {
  id?: number;
  category?: Category;
  name: string;
  photoUrls: string[];
  tags?: Tag[];
  status?: PetStatus;
}

export class PetFactory {
  private static counter = 0;

  static build(overrides: Partial<Pet> = {}): Pet {
    const uid = ++this.counter;
    const id = overrides.id ?? Math.floor(Math.random() * 800_000) + 100_000;
    return {
      id,
      category: { id: uid, name: "Dogs" },
      name: `AutoPet_${uid}_${Date.now()}`,
      photoUrls: [`https://cdn.example.com/pets/${uid}.jpg`],
      tags: [{ id: uid, name: "automated" }],
      status: "available",
      ...overrides,
    };
  }
}
