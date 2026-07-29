import z from "zod";

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().min(1, "Slug is required").max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  eventDate: z.string().transform((val) => new Date(val)),
  location: z.string().max(500).optional(),
});

export const toggleEventStatusSchema = z.object({
  id: z.string().min(1),
  currentStatus: z.boolean(),
});

export const deleteRegistrationSchema = z.object({
  id: z.string().min(1),
});

export const getRegistrationsSchema = z.object({
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(50),
  eventId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  syncStatus: z.enum(["all", "synced", "unsynced"]).optional(),
});
