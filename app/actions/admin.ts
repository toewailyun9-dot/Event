'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { getRegistrationsSchema, deleteRegistrationSchema, getEventsSchema } from '@/lib/validation/admin'
import { createRegistrationSchema } from '@/lib/validation/registerations'

// ၁။ Registrations အားလုံးကို ယူသည့် Action (with pagination + search + filters)
export async function getRegistrations(params?: {
  search?: string
  page?: number
  pageSize?: number
  eventId?: string
  dateFrom?: string
  dateTo?: string
}) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const parsed = getRegistrationsSchema.parse(params ?? {})
    const search = parsed.search?.trim() ?? ''
    const page = parsed.page
    const pageSize = parsed.pageSize
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search } },
      ]
    }

    if (parsed.eventId) {
      where.eventId = parsed.eventId
    }

    if (parsed.dateFrom || parsed.dateTo) {
      const createdAt: Record<string, Date> = {}
      if (parsed.dateFrom) createdAt.gte = new Date(parsed.dateFrom)
      if (parsed.dateTo) createdAt.lte = new Date(parsed.dateTo + 'T23:59:59.999Z')
      where.createdAt = createdAt
    }

    const [data, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip,
        include: { event: { select: { title: true } } },
      }),
      prisma.registration.count({ where }),
    ])

    return { success: true, data, total, page, pageSize }
  } catch (error) {
    console.error('Failed to fetch registrations:', error)
    return { success: false, error: 'Data များ ဆွဲထုတ်၍ မရပါ။' }
  }
}

// Events list for filter dropdown
export async function getEventsForFilter() {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, isActive: true },
    })
    return { success: true, data: events }
  } catch (error) {
    console.error('Failed to fetch events:', error)
    return { success: false, error: 'Event များ ဆွဲထုတ်၍ မရပါ။' }
  }
}

// Events list with pagination + search + status filter
export async function getEvents(params?: {
  search?: string
  status?: 'ALL' | 'ACTIVE' | 'CLOSED'
  page?: number
  pageSize?: number
}) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const parsed = getEventsSchema.parse(params ?? {})
    const search = parsed.search?.trim() ?? ''
    const skip = (parsed.page - 1) * parsed.pageSize

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { location: { contains: search, mode: 'insensitive' as const } },
      ]
    }

    if (parsed.status === 'ACTIVE') where.isActive = true
    if (parsed.status === 'CLOSED') where.isActive = false

    const [data, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parsed.pageSize,
        skip,
        include: {
          _count: { select: { registrations: true } },
        },
      }),
      prisma.event.count({ where }),
    ])

    return { success: true, data, total }
  } catch (error) {
    console.error('Failed to fetch events:', error)
    return { success: false, error: 'Event များ ဆွဲထုတ်၍ မရပါ။' }
  }
}

export type ImportRowInput = {
  row: number
  name: string
  email: string
  age: string
  phone: string
  address: string
}

type ImportRegistrationsSuccess = {
  success: true
  total: number
  imported: number
  duplicates: number
  invalid: number
  errors: { row: number; error: string }[]
}

type ImportRegistrationsError = { success: false; error: string }
export type ImportRegistrationsResult = ImportRegistrationsSuccess | ImportRegistrationsError

const MAX_IMPORT_ROWS = 2000
const IMPORT_BATCH_SIZE = 100

// CSV ဖိုင်မှ Registration Data အများအပြားကို တစ်ခါတည်း ထည့်သွင်းခြင်း။
// Duplicate prevention: rows are validated row-by-row (invalid rows are
// reported with their CSV row number), then inserted with createMany +
// skipDuplicates so existing (eventId, email) pairs are skipped, never
// duplicated. If no eventId is given, the latest active event is used.
export async function importRegistrations(
  params: { eventId?: string; rows: ImportRowInput[] }
): Promise<ImportRegistrationsResult> {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const rows = params?.rows
    if (!Array.isArray(rows) || rows.length === 0) {
      return { success: false, error: 'Import လုပ်ရန် Data များ မရှိပါ။' }
    }
    if (rows.length > MAX_IMPORT_ROWS) {
      return { success: false, error: `Import ပမာဏ တစ်ကြိမ်လျှင် ${MAX_IMPORT_ROWS} ခုထက် မကျော်ရပါ။` }
    }

    // Resolve the target event: provided id, or the latest active event.
    let targetEventId = params.eventId
    if (targetEventId) {
      const eventExists = await prisma.event.findUnique({
        where: { id: targetEventId },
        select: { id: true },
      })
      if (!eventExists) {
        return { success: false, error: 'သက်ဆိုင်ရာ Event ကို ရှာမတွေ့ပါ။' }
      }
    } else {
      const latestEvent = await prisma.event.findFirst({
        where: { isActive: true },
        select: { id: true },
      })
      if (!latestEvent) {
        return { success: false, error: 'လက်ရှိ စာရင်းသွင်းနိုင်သော Event မရှိသေးပါ။' }
      }
      targetEventId = latestEvent.id
    }

    const errors: { row: number; error: string }[] = []
    const validRows: { name: string; email: string; age: number; phone: string; address: string }[] = []

    for (const input of rows) {
      const parsed = createRegistrationSchema.safeParse({
        eventId: targetEventId,
        name: input.name,
        email: input.email,
        age: Number(input.age),
        phone: input.phone,
        address: input.address,
      })
      if (parsed.success) {
        validRows.push(parsed.data)
      } else {
        errors.push({
          row: input.row,
          error: parsed.error.errors[0]?.message || 'ဒေတာ မမှန်ကန်ပါ။',
        })
      }
    }

    let created = 0
    for (let i = 0; i < validRows.length; i += IMPORT_BATCH_SIZE) {
      const chunk = validRows.slice(i, i + IMPORT_BATCH_SIZE).map((row) => ({
        eventId: targetEventId,
        fullName: row.name,
        email: row.email,
        age: row.age,
        phone: row.phone,
        address: row.address,
      }))
      const result = await prisma.registration.createMany({ data: chunk, skipDuplicates: true })
      created += result.count
    }

    revalidatePath('/admin')
    revalidatePath(`/events/${targetEventId}`)

    return {
      success: true,
      total: rows.length,
      imported: created,
      duplicates: validRows.length - created,
      invalid: errors.length,
      errors,
    }
  } catch (error) {
    console.error('CSV Import Error:', error)
    return { success: false, error: 'CSV Import ပြုလုပ်ခြင်း မအောင်မြင်ပါ။' }
  }
}

// ၂။ Registration တစ်ခုကို ဖျက်သည့် Action
export async function deleteRegistration(id: string) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const { id: validatedId } = deleteRegistrationSchema.parse({ id })

    await prisma.registration.delete({
      where: { id: validatedId },
    })
    revalidatePath('/admin') 
    return { success: true }
  } catch (error) {
    console.error('Failed to delete registration:', error)
    return { success: false, error: 'ဖျက်ထုတ်ခြင်း မအောင်မြင်ပါ။' }
  }
}