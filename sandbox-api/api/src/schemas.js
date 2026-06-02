import { z } from "zod";

export const RestaurantQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
  cuisine: z.string().min(1).max(80).optional(),
  minOverall: z.coerce.number().min(0).max(30).optional()
});
