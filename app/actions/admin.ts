'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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
    const search = params?.search?.trim() ?? ''
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 50
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search } },
      ]
    }

    if (params?.eventId) {
      where.eventId = params.eventId
    }

    if (params?.dateFrom || params?.dateTo) {
      const createdAt: Record<string, Date> = {}
      if (params.dateFrom) createdAt.gte = new Date(params.dateFrom)
      if (params.dateTo) createdAt.lte = new Date(params.dateTo + 'T23:59:59.999Z')
      where.createdAt = createdAt
    }

    if (params?.syncStatus && params.syncStatus !== 'all') {
      where.isOfflineSynced = params.syncStatus === 'synced'
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

// ၂။ Registration တစ်ခုကို ဖျက်သည့် Action
export async function deleteRegistration(id: string) {
  try {
    await prisma.registration.delete({
      where: { id },
    })
    revalidatePath('/admin') 
    return { success: true }
  } catch (error) {
    console.error('Failed to delete registration:', error)
    return { success: false, error: 'ဖျက်ထုတ်ခြင်း မအောင်မြင်ပါ။' }
  }
}