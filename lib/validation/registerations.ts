import z from "zod";

// 1. Zod Schema ထဲတွင် eventId ကို optional ပြောင်းထားပါသည်
export const createRegistrationSchema = z.object({
  eventId: z.string().optional(), // 👈 optional ဖြစ်သွားပါပြီ
  name: z.string().min(2, { message: 'အမည်သည် အနည်းဆုံး ၂ လုံး ရှိရပါမည်။' }),
  email: z.string().email({ message: 'မှန်ကန်သော Email လိပ်စာ ထည့်သွင်းပါ။' }),
  age: z.number().min(10, { message: 'အသက်သည် အနည်းဆုံး 10 နှစ် ဖြစ်ရပါမည်။' }).max(120),
  phone: z.string().min(8, { message: 'မှန်ကန်သော ဖုန်းနံပါတ် ထည့်သွင်းပါ။' }),
  address: z.string().min(5, { message: 'လိပ်စာသည် အနည်းဆုံး ၅ လုံး ရှိရပါမည်။' }),
  // Idempotency key for offline→online sync deduplication
  syncId: z.string().optional(),
})
