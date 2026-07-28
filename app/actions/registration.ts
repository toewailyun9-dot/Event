'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// 1. Zod Schema ထဲတွင် eventId ကို optional ပြောင်းထားပါသည်
const createRegistrationSchema = z.object({
  eventId: z.string().optional(), // 👈 optional ဖြစ်သွားပါပြီ
  name: z.string().min(2, { message: 'အမည်သည် အနည်းဆုံး ၂ လုံး ရှိရပါမည်။' }),
  email: z.string().email({ message: 'မှန်ကန်သော Email လိပ်စာ ထည့်သွင်းပါ။' }),
  age: z.number().min(10, { message: 'အသက်သည် အနည်းဆုံး 10 နှစ် ဖြစ်ရပါမည်။' }).max(120),
  phone: z.string().min(8, { message: 'မှန်ကန်သော ဖုန်းနံပါတ် ထည့်သွင်းပါ။' }),
  address: z.string().min(5, { message: 'လိပ်စာသည် အနည်းဆုံး ၅ လုံး ရှိရပါမည်။' }),
})

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>

export async function createRegistration(data: CreateRegistrationInput) {
  try {
    // 1. Server-side Data Validation
    const validatedData = createRegistrationSchema.parse(data)

    let targetEventId = validatedData.eventId

    // 2. eventId ပါမလာခဲ့ပါက Database ထဲရှိ နောက်ဆုံး Event ကို Auto ရှာပေးခြင်း
    if (!targetEventId) {
      const latestEvent = await prisma.event.findFirst({
       
        select: {
          id: true,
          isActive: true,
        },
      })

      if (!latestEvent) {
        return { success: false, error: 'လက်ရှိ စာရင်းသွင်းနိုင်သော Event မရှိသေးပါ။' }
      }

      targetEventId = latestEvent.id
    } else {
      // eventId ပါလာခဲ့ပါက ထို Event အမှန်တကယ် ရှိမရှိ စစ်ဆေးခြင်း
      const eventExists = await prisma.event.findUnique({
        where: { id: targetEventId },
      })

      if (!eventExists) {
        return { success: false, error: 'သက်ဆိုင်ရာ Event ကို ရှာမတွေ့ပါ။' }
      }
    }

    // 3. Duplicate Registration စစ်ဆေးခြင်း
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        eventId: targetEventId,
        email: validatedData.email,
      },
    })

    if (existingRegistration) {
      return {
        success: false,
        error: 'ဤ Email ဖြင့် Event ထဲသို့ Register ပြုလုပ်ပြီး ဖြစ်ပါသည်။',
      }
    }

    // 4. Registration Data အသစ် သိမ်းဆည်းခြင်း
    const newRegistration = await prisma.registration.create({
      data: {
        eventId: targetEventId,
        fullName: validatedData.name,
        email: validatedData.email,
        age: validatedData.age,
        phone: validatedData.phone,
        address: validatedData.address,
      },
    })

    // 5. Cache များကို Revalidate လုပ်ပေးခြင်း
    revalidatePath('/admin/registrations')
    revalidatePath(`/events/${targetEventId}`)

    return { success: true, data: newRegistration }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'ဖြည့်သွင်းချက်များ မှားယွင်းနေပါသည်။',
      }
    }

    console.error('Registration Error:', error)
    return { success: false, error: 'Registration ပြုလုပ်ခြင်း မအောင်မြင်ပါ။' }
  }
}