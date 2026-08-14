import z from "zod";

const eventDateSchema = z
  .union([z.string(), z.date()])
  .transform((val) => new Date(val))
  .refine((date) => !Number.isNaN(date.getTime()), {
    message: "မှန်ကန်သော ရက်စွဲနှင့် အချိန် ထည့်သွင်းပါ။",
  })
  // Events may only be created for the present or the future.
  .refine((date) => date.getTime() >= Date.now(), {
    message: "Event ရက်စွဲသည် လက်ရှိအချိန်ထက် မစောနိုင်ပါ။",
  });

// Telegram / Viber Group Invite Links — ပုံမှန် full URL များ (https://)
// သို့မဟုတ် app scheme (viber://, tg://) များကို လက်ခံသည်။
// ဖောင်တွင် မဖြည့်ထားလျှင် "" သို့မဟုတ် undefined ဖြစ်နိုင်သည်။
const inviteLink = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .max(500)
      .regex(
        /^(https?|viber|tg):\/\/|^t\.me\//,
        "မှန်ကန်သော Link (URL) ထည့်သွင်းပါ။"
      ),
  ])
  .optional();

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().min(1, "Slug is required").max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  eventDate: eventDateSchema,
  location: z.string().max(500).optional(),
  telegramLink: inviteLink,
  viberLink: inviteLink,
});

export const toggleEventStatusSchema = z.object({
  id: z.string().min(1),
  currentStatus: z.boolean(),
});

export const updateEventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().min(1, "Slug is required").max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  eventDate: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
  location: z.string().max(500).optional(),
  telegramLink: inviteLink,
  viberLink: inviteLink,
});

export const deleteEventSchema = z.object({
  id: z.string().min(1),
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
});

export const sendEmailCampaignSchema = z.object({
  eventId: z.string().min(1),
  subject: z.string().min(1, "Subject ထည့်သွင်းရန် လိုအပ်ပါသည်။").max(200),
  body: z.string().min(1, "Message ထည့်သွင်းရန် လိုအပ်ပါသည်။").max(10000),
});

export const getEmailMessagesSchema = z.object({
  eventId: z.string().optional(),
  status: z.enum(["PENDING", "SENT", "FAILED"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(50),
});
