import { z } from "zod";

export const RestaurantListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(5)
});

export type RestaurantListQuery = z.infer<typeof RestaurantListQuerySchema>;
