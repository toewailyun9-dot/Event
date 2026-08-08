'use server'

import { prisma } from '@/lib/prisma'
import { getClientIp, registrationRateLimit } from '@/lib/rate-limit'
import { createRegistrationSchema } from '@/lib/validation/registerations'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import z from 'zod'

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>

export async function createRegistration(data: CreateRegistrationInput) {
  try {
    // Rate-limit at the action layer so the online form path cannot bypass
    // the guard that previously lived only on /api/register.
    const ip = getClientIp(await headers())
    const { allowed } = registrationRateLimit(ip)
    if (!allowed) {
      return {
        success: false,
        error: 'Too many requests. Please try again later.',
      }
    }

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
        where: { isActive: true },
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
        // Store the idempotency key
        ...(validatedData.syncId ? { syncId: validatedData.syncId } : {}),
      },
    })

    // 4. Cache များကို Revalidate လုပ်ပေးခြင်း
    revalidatePath('/admin/registrations')
    revalidatePath(`/events/${targetEventId}`)

    return { success: true, data: newRegistration }
  } catch (error: unknown) {
    // ─── PRISMA UNIQUE CONSTRAINT VIOLATION ────────────────────────
    // Fallback: if both SW and client hit simultaneously and bypassed
    // the syncId check, the DB-level unique constraint will catch it.
    const prismaError = error as { code?: string; meta?: { target?: string[] }; name?: string }
    if (prismaError?.name === 'PrismaClientKnownRequestError' && prismaError?.code === 'P2002') {
      const target = prismaError.meta?.target ?? []
      if (target.includes('email') && target.includes('eventId')) {
        return {
          success: false,
          error: 'ဤ Email ဖြင့် Event ထဲသို့ Register ပြုလုပ်ပြီး ဖြစ်ပါသည်။',
        }
      }
      if (target.includes('syncId')) {
        return { success: true, data: { id: 'already-synced' } }
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

/**
 * Batch version of createRegistration for offline-sync flushing.
 * Sends up to MAX_BATCH_SIZE records in one request/transaction so that
 * an offline queue of N records costs N/MAX_BATCH_SIZE HTTP round-trips
 * instead of N (800 sequential calls ≈ 40 min → 8 batch calls ≈ seconds).
 *
 * Idempotency: records whose syncId already exists on the server are
 * treated as duplicates (skipped, counted). skipDuplicates additionally
 * guards the (eventId, email) unique constraint.
 */
export async function createRegistrationsBatch(items: CreateRegistrationInput[]) {
  // Upper bound per request to keep payloads small and rate limiting effective.
  const MAX_BATCH_SIZE = 100
  try {
    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, error: 'Sync လုပ်ရန် Data များ မရှိပါ။' }
    }
    if (items.length > MAX_BATCH_SIZE) {
      return { success: false, error: `Batch size ${items.length} exceeds the limit of ${MAX_BATCH_SIZE}.` }
    }

    const validatedItems = items.map((item) => createRegistrationSchema.parse(item))

    // Resolve the target event once for items that don't specify one.
    let resolvedEventId = validatedItems[0].eventId
    if (!resolvedEventId) {
      const latestEvent = await prisma.event.findFirst({
        where: { isActive: true },
        select: { id: true },
      })
      if (!latestEvent) {
        return { success: false, error: 'လက်ရှိ စာရင်းသွင်းနိုင်သော Event မရှိသေးပါ။' }
      }
      resolvedEventId = latestEvent.id
    } else {
      const eventExists = await prisma.event.findUnique({
        where: { id: resolvedEventId },
        select: { id: true },
      })
      if (!eventExists) {
        return { success: false, error: 'သက်ဆိုင်ရာ Event ကို ရှာမတွေ့ပါ။' }
      }
    }

    // Idempotency check: skip records whose syncId is already persisted.
    const syncIds = validatedItems
      .map((item) => item.syncId)
      .filter((s): s is string => Boolean(s))
    const existingSyncIds = syncIds.length
      ? await prisma.registration.findMany({
          where: { syncId: { in: syncIds } },
          select: { syncId: true },
        })
      : []
    const existingSet = new Set(existingSyncIds.map((r) => r.syncId))

    const toCreate = validatedItems
      .filter((item) => !(item.syncId && existingSet.has(item.syncId)))
      .map((item) => ({
        eventId: item.eventId || resolvedEventId,
        fullName: item.name,
        email: item.email,
        age: item.age,
        phone: item.phone,
        address: item.address,
        ...(item.syncId ? { syncId: item.syncId } : {}),
      }))

    let createdCount = 0
    if (toCreate.length > 0) {
      const result = await prisma.registration.createMany({
        data: toCreate,
        skipDuplicates: true,
      })
      createdCount = result.count
    }

    revalidatePath('/admin')
    revalidatePath(`/events/${resolvedEventId}`)

    return {
      success: true,
      total: validatedItems.length,
      created: createdCount,
      duplicates: validatedItems.length - createdCount,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'ဖြည့်သွင်းချက်များ မှားယွင်းနေပါသည်။' }
    }
    console.error('Batch Registration Error:', error)
    return { success: false, error: 'Registration ပြုလုပ်ခြင်း မအောင်မြင်ပါ။' }
  }
}
