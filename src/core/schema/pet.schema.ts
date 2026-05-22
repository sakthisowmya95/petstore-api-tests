import { z } from "zod";

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
}).passthrough();

export const TagSchema = z.object({
  id: z.number(),
  name: z.string(),
}).passthrough();

export const PetStatusSchema = z.enum(["available", "pending", "sold"]);

export const PetSchema = z.object({
  id: z.number().optional(),
  category: CategorySchema.optional(),
  name: z.string(),
  photoUrls: z.array(z.string()),
  tags: z.array(TagSchema).optional(),
  status: PetStatusSchema.optional(),
}).passthrough();

export const PetListItemSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional().nullable(),
  photoUrls: z.array(z.unknown()).optional().nullable(),
  category: z.unknown().optional().nullable(),
  tags: z.array(z.unknown()).optional().nullable(),
  status: z.string().optional().nullable(),
}).passthrough();

export const PetListSchema = z.array(PetListItemSchema);

export type PetStatus = z.infer<typeof PetStatusSchema>;
export type ValidatedPet = z.infer<typeof PetSchema>;
