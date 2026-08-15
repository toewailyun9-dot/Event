'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import z from 'zod'
import { createEventSchema, toggleEventStatusSchema, updateEventSchema, deleteEventSchema } from '@/lib/validation/admin'

export async function createEvent(data: {
  title: string
  eventDate: Date
  location?: string
  telegramLink?: string
  viberLink?: string
}) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const validated = createEventSchema.parse(data)

    const newEvent = await prisma.event.create({
      data: {
        title: validated.title,
        eventDate: validated.eventDate,
        location: validated.location,
        telegramLink: validated.telegramLink || null,
        viberLink: validated.viberLink || null,
      },
    })

    revalidatePath('/admin/events')
    revalidatePath('/')
    return { success: true, data: newEvent }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'ဖြည့်သွင်းချက်များ မှားယွင်းနေပါသည်။',
      }
    }
    console.error('Create Event Error:', error)
    return { success: false, error: 'Event ဖန်တီးခြင်း မအောင်မြင်ပါ။' }
  }
}

export async function toggleEventStatus(id: string, currentStatus: boolean) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const validated = toggleEventStatusSchema.parse({ id, currentStatus })

    await prisma.event.update({
      where: { id: validated.id },
      data: { isActive: !validated.currentStatus },
    })

    revalidatePath('/admin/events')
    revalidatePath('/')
    revalidatePath(`/events/${validated.id}`)
    return { success: true }
  } catch (error) {
    console.error('Toggle status error:', error)
    return { success: false, error: 'Status ပြောင်းလဲခြင်း မအောင်မြင်ပါ။' }
  }
}

export async function updateEvent(
  id: string,
  data: {
    title: string
    eventDate: Date
    location?: string
    telegramLink?: string
    viberLink?: string
  }
) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const validated = updateEventSchema.parse({ id, ...data })

    await prisma.event.update({
      where: { id: validated.id },
      data: {
        title: validated.title,
        eventDate: validated.eventDate,
        location: validated.location,
        telegramLink: validated.telegramLink || null,
        viberLink: validated.viberLink || null,
      },
    })

    revalidatePath('/admin/events')
    revalidatePath(`/admin/events/${validated.id}`)
    revalidatePath('/')
    revalidatePath(`/events/${validated.id}`)
    return { success: true }
  } catch (error) {
    console.error('Update Event Error:', error)
    return { success: false, error: 'Event ပြင်ဆင်ခြင်း မအောင်မြင်ပါ။' }
  }
}

export async function deleteEvent(id: string) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const validated = deleteEventSchema.parse({ id })

    await prisma.event.delete({
      where: { id: validated.id },
    })

    revalidatePath('/admin/events')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Delete Event Error:', error)
    return { success: false, error: 'Event ဖျက်ခြင်း မအောင်မြင်ပါ။' }
  }
}
