'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import z from 'zod'
import {
  createSponsorSchema,
  updateSponsorSchema,
  deleteSponsorSchema,
  createEventSponsorSchema,
  deleteEventSponsorSchema,
  getSponsorsSchema,
} from '@/lib/validation/admin'

export async function getSponsors(params?: {
  search?: string
  page?: number
  pageSize?: number
}) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const parsed = getSponsorsSchema.parse(params ?? {})
    const search = parsed.search?.trim() ?? ''
    const skip = (parsed.page - 1) * parsed.pageSize

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { website: { contains: search, mode: 'insensitive' as const } },
        { contactEmail: { contains: search, mode: 'insensitive' as const } },
        { contactName: { contains: search, mode: 'insensitive' as const } },
        { contactPhone: { contains: search } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.sponsor.findMany({
        where,
        orderBy: { name: 'asc' },
        take: parsed.pageSize,
        skip,
        include: { _count: { select: { events: true } } },
      }),
      prisma.sponsor.count({ where }),
    ])

    return { success: true, data, total }
  } catch (error) {
    console.error('Failed to fetch sponsors:', error)
    return { success: false, error: 'Sponsor များ ဆွဲထုတ်၍ မရပါ။' }
  }
}

export async function createSponsor(data: {
  name: string
  website?: string
  description?: string
  contactEmail?: string
  contactName?: string
  contactPhone?: string
}) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const validated = createSponsorSchema.parse(data)

    const sponsor = await prisma.sponsor.create({
      data: {
        name: validated.name,
        website: validated.website || null,
        description: validated.description,
        contactEmail: validated.contactEmail,
        contactName: validated.contactName,
        contactPhone: validated.contactPhone,
      },
    })

    revalidatePath('/admin/sponsors')
    revalidatePath('/admin/events')
    return { success: true, data: sponsor }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'ဖြည့်သွင်းချက်များ မှားယွင်းနေပါသည်။',
      }
    }
    console.error('Create Sponsor Error:', error)
    return { success: false, error: 'Sponsor ဖန်တီးခြင်း မအောင်မြင်ပါ။' }
  }
}

export async function updateSponsor(
  id: string,
  data: {
    name: string
    website?: string
    description?: string
    contactEmail?: string
    contactName?: string
    contactPhone?: string
  }
) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const validated = updateSponsorSchema.parse({ id, ...data })

    await prisma.sponsor.update({
      where: { id: validated.id },
      data: {
        name: validated.name,
        website: validated.website || null,
        description: validated.description,
        contactEmail: validated.contactEmail,
        contactName: validated.contactName,
        contactPhone: validated.contactPhone,
      },
    })

    revalidatePath('/admin/sponsors')
    revalidatePath('/admin/events')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'ဖြည့်သွင်းချက်များ မှားယွင်းနေပါသည်။',
      }
    }
    console.error('Update Sponsor Error:', error)
    return { success: false, error: 'Sponsor ပြင်ဆင်ခြင်း မအောင်မြင်ပါ။' }
  }
}

export async function deleteSponsor(id: string) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const validated = deleteSponsorSchema.parse({ id })

    await prisma.sponsor.delete({
      where: { id: validated.id },
    })

    revalidatePath('/admin/sponsors')
    revalidatePath('/admin/events')
    return { success: true }
  } catch (error) {
    console.error('Delete Sponsor Error:', error)
    return { success: false, error: 'Sponsor ဖျက်ခြင်း မအောင်မြင်ပါ။' }
  }
}

export async function addSponsorToEvent(data: {
  eventId: string
  sponsorId: string
  amount?: number
}) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const validated = createEventSponsorSchema.parse(data)

    const existing = await prisma.eventSponsor.findUnique({
      where: {
        eventId_sponsorId: {
          eventId: validated.eventId,
          sponsorId: validated.sponsorId,
        },
      },
    })

    if (existing) {
      return { success: false, error: 'ဤ Sponsor သည် Event တွင် ထည့်သွင်းပြီးသားဖြစ်ပါသည်။' }
    }

    await prisma.eventSponsor.create({
      data: {
        eventId: validated.eventId,
        sponsorId: validated.sponsorId,
        amount: validated.amount,
      },
    })

    revalidatePath(`/admin/events/${validated.eventId}`)
    revalidatePath(`/events/${validated.eventId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'ဖြည့်သွင်းချက်များ မှားယွင်းနေပါသည်။',
      }
    }
    console.error('Add Sponsor to Event Error:', error)
    return { success: false, error: 'Sponsor ထည့်သွင်းခြင်း မအောင်မြင်ပါ။' }
  }
}

export async function removeSponsorFromEvent(eventId: string, sponsorId: string) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const validated = deleteEventSponsorSchema.parse({ eventId, sponsorId })

    await prisma.eventSponsor.delete({
      where: {
        eventId_sponsorId: {
          eventId: validated.eventId,
          sponsorId: validated.sponsorId,
        },
      },
    })

    revalidatePath(`/admin/events/${validated.eventId}`)
    revalidatePath(`/events/${validated.eventId}`)
    return { success: true }
  } catch (error) {
    console.error('Remove Sponsor from Event Error:', error)
    return { success: false, error: 'Sponsor ဖယ်ရှားခြင်း မအောင်မြင်ပါ။' }
  }
}