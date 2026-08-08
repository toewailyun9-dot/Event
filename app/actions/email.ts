'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import {
  sendEmailCampaignSchema,
  getEmailMessagesSchema,
} from '@/lib/validation/admin'

type Recipient = { email: string; fullName: string }

// Distinct attendee emails for an event, minus unsubscribed addresses and
// people who already have an EmailMessage row for this event (prevents
// accidental duplicate campaigns to the same event).
async function collectRecipients(eventId: string): Promise<Recipient[]> {
  const [registrations, unsubscribed, alreadyMessaged] = await Promise.all([
    prisma.registration.findMany({
      where: { eventId },
      distinct: ['email'],
      select: { email: true, fullName: true },
    }),
    prisma.unsubscribedEmail.findMany({ select: { email: true } }),
    prisma.emailMessage.findMany({
      where: { eventId },
      select: { to: true },
    }),
  ])

  const unsubscribedSet = new Set(unsubscribed.map((u) => u.email.toLowerCase()))
  const alreadySet = new Set(alreadyMessaged.map((m) => m.to.toLowerCase()))

  return registrations.filter((r) => {
    const email = r.email.toLowerCase()
    return !unsubscribedSet.has(email) && !alreadySet.has(email)
  })
}

type PreviewResult =
  | { success: true; count: number; eventTitle: string }
  | { success: false; error: string }

export async function previewEmailRecipients({
  eventId,
}: {
  eventId: string
}): Promise<PreviewResult> {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { title: true },
    })
    if (!event) return { success: false, error: 'Event မတွေ့ပါ။' }

    const recipients = await collectRecipients(eventId)
    return { success: true, count: recipients.length, eventTitle: event.title }
  } catch (error) {
    console.error('Failed to preview email recipients:', error)
    return { success: false, error: 'လက်ခံမည့်သူ အရေအတွက် ရယူ၍ မရပါ။' }
  }
}

export async function sendEmailCampaign(input: z.infer<typeof sendEmailCampaignSchema>) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const parsed = sendEmailCampaignSchema.parse(input)

    const event = await prisma.event.findUnique({
      where: { id: parsed.eventId },
      select: { title: true, eventDate: true },
    })
    if (!event) return { success: false, error: 'Event မတွေ့ပါ။' }

    const recipients = await collectRecipients(parsed.eventId)

    if (recipients.length === 0) {
      return {
        success: false,
        error: 'ပို့ရန် လက်ခံသူ မရှိပါ။ (အားလုံးကို ပို့ပြီးသား သို့မဟုတ် unsubscribed ဖြစ်နေပါသည်။)',
      }
    }

    const rows = recipients.map((r) => ({
      eventId: parsed.eventId,
      eventTitle: event.title,
      eventDate: event.eventDate,
      to: r.email,
      name: r.fullName,
      subject: parsed.subject,
      body: parsed.body,
    }))

    // Insert in chunks of 100 — free tier is 100/day, and one batch send
    // call handles up to 100 messages.
    for (let i = 0; i < rows.length; i += 100) {
      await prisma.emailMessage.createMany({
        data: rows.slice(i, i + 100),
        skipDuplicates: true,
      })
    }

    return {
      success: true,
      count: rows.length,
      message: `Email ${rows.length} ယောက်ဆီ ပို့ရန် စာရင်းသွင်းပြီးပါပြီ။`,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'ဖြည့်သွင်းချက်များ မှားယွင်းနေပါသည်။',
      }
    }
    console.error('Failed to create email campaign:', error)
    return { success: false, error: 'Email Campaign ဖန်တီး၍ မရပါ။' }
  }
}

export async function getEmailMessages(params?: {
  eventId?: string
  status?: string
  page?: number
  pageSize?: number
}) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return { success: false, error: auth.error }

    const parsed = getEmailMessagesSchema.parse(params ?? {})
    const where: Record<string, unknown> = {}
    if (parsed.eventId) where.eventId = parsed.eventId
    if (parsed.status) where.status = parsed.status

    const skip = (parsed.page - 1) * parsed.pageSize

    const [data, total] = await Promise.all([
      prisma.emailMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parsed.pageSize,
        skip,
        include: { event: { select: { title: true } } },
      }),
      prisma.emailMessage.count({ where }),
    ])

    return { success: true, data, total }
  } catch (error) {
    console.error('Failed to fetch email messages:', error)
    return { success: false, error: 'Email Message များ ရယူ၍ မရပါ။' }
  }
}
