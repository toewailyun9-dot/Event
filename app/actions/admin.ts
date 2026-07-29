'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { getRegistrationsSchema, deleteRegistrationSchema } from '@/lib/validation/admin'

// ၁။ Registrations အားလုံးကို ယူသည့် Action (with pagination + search + filters)
export async function getRegistrations(params?: {
  search?: string
  page?: number
  pageSize?: number
  eventId?: string
  dateFrom?: string
  dateTo?: string
  syncStatus?: 'all' | 'synced' | 'unsynced'
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

    if (parsed.syncStatus && parsed.syncStatus !== 'all') {
      where.isOfflineSynced = parsed.syncStatus === 'synced'
    }

    const [data, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip,
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

type ExportCSVSuccess = { success: true; csv: string; filename: string }
type ExportCSVError = { success: false; error: string }
type ExportCSVResult = ExportCSVSuccess | ExportCSVError

// ၁.၅။ Event တစ်ခုချင်းစီအတွက် CSV Export
export async function exportEventCSV(eventId: string): Promise<ExportCSVResult> {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!event) return { success: false, error: 'Event မတွေ့ပါ။' }

    const headers = 'Name,Email,Age,Phone,Address,Registered Date,Source\n'
    const rows = event.registrations.map((r) =>
      `"${r.fullName}","${r.email}",${r.age},"${r.phone}","${r.address}","${new Date(r.createdAt).toLocaleDateString()}","${r.isOfflineSynced ? 'Synced' : 'Online'}"`
    )

    const csv = headers + rows.join('\n')
    const filename = `${event.title.replace(/[^a-zA-Z0-9 ]/g, '_')}-${new Date().toISOString().slice(0, 10)}.csv`

    return { success: true, csv, filename }
  } catch (error) {
    console.error('Failed to export CSV:', error)
    return { success: false, error: 'CSV Export မအောင်မြင်ပါ။' }
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