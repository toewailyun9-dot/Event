'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { createEventSchema, toggleEventStatusSchema } from '@/lib/validation/admin'

export async function createEvent(data: {
  title: string
  slug: string
  eventDate: Date
  location?: string
}) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const validated = createEventSchema.parse(data)

    const newEvent = await prisma.event.create({
      data: {
        title: validated.title,
        slug: validated.slug,
        eventDate: validated.eventDate,
        location: validated.location,
      },
    })

    revalidatePath('/admin/events')
    return { success: true, data: newEvent }
  } catch (error) {
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
    return { success: true }
  } catch (error) {
    console.error('Toggle status error:', error)
    return { success: false, error: 'Status ပြောင်းလဲခြင်း မအောင်မြင်ပါ။' }
  }
}
