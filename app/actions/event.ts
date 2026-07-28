'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createEvent(data: {
  title: string
  slug: string
  eventDate: Date
  location?: string
}) {
  try {
    const newEvent = await prisma.event.create({
      data: {
        title: data.title,
        slug: data.slug, 
        eventDate: data.eventDate,
        location: data.location,
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
    await prisma.event.update({
      where: { id },
      data: { isActive: !currentStatus },
    })

    revalidatePath('/admin/events')
    return { success: true }
  } catch (error) {
    console.error('Toggle status error:', error)
    return { success: false, error: 'Status ပြောင်းလဲခြင်း မအောင်မြင်ပါ။' }
  }
}