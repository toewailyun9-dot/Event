'use server'

import { prisma } from '@/lib/prisma'
import { createRegistrationSchema } from '@/lib/validation/registerations'
import { revalidatePath } from 'next/cache'
import z from 'zod'
import { Prisma } from '../../generated/prisma/client'




export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>

export async function createRegistration(data: CreateRegistrationInput) {
  try {
    // 1. Server-side Data Validation
    const validatedData = createRegistrationSchema.parse(data)

    // ─── IDEMPOTENCY CHECK ─────────────────────────────────────────
    // If this registration has a syncId (i.e. it came from offline),
    // check if we already processed it. This is the PRIMARY defense
    // against duplicates when both SW Background Sync and client-side
    // sync run simultaneously.
    if (validatedData.syncId) {
      const existingBySyncId = await prisma.registration.findUnique({
        where: { syncId: validatedData.syncId },
        select: { id: true },
      })

      if (existingBySyncId) {
        // Already processed — return success without creating duplicate
        console.log(`[Server] Duplicate syncId detected (${validatedData.syncId}), returning success.`)
        return { success: true, data: { id: existingBySyncId.id } }
      }
    }

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

    // 3. Registration Data အသစ် သိမ်းဆည်းခြင်း
    //    DB-level unique constraint on (eventId, email) will catch
    //    any remaining race conditions that bypass the syncId check.
    const newRegistration = await prisma.registration.create({
      data: {
        eventId: targetEventId,
        fullName: validatedData.name,
        email: validatedData.email,
        age: validatedData.age,
        phone: validatedData.phone,
        address: validatedData.address,
        // If this came from offline sync, tag it
        isOfflineSynced: validatedData.isOfflineSynced ?? false,
        // Store the idempotency key
        ...(validatedData.syncId ? { syncId: validatedData.syncId } : {}),
      },
    })

    // 4. Cache များကို Revalidate လုပ်ပေးခြင်း
    revalidatePath('/admin/registrations')
    revalidatePath(`/events/${targetEventId}`)

    return { success: true, data: newRegistration }
  } catch (error) {
    // ─── PRISMA UNIQUE CONSTRAINT VIOLATION ────────────────────────
    // Fallback: if both SW and client hit simultaneously and bypassed
    // the syncId check, the DB-level unique constraint will catch it.
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = (error.meta?.target as string[]) ?? []
        if (target.includes('email') && target.includes('eventId')) {
          return {
            success: false,
            error: 'ဤ Email ဖြင့် Event ထဲသို့ Register ပြုလုပ်ပြီး ဖြစ်ပါသည်။',
          }
        }
        if (target.includes('syncId')) {
          // syncId unique constraint violation — this is actually fine,
          // means the other concurrent request already created it
          return { success: true, data: { id: 'already-synced' } }
        }
      }
    }

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
