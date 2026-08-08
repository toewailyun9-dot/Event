import { prisma } from '@/lib/prisma'
import { resend, emailFrom } from '@/lib/email'
import { buildEmailHtml, buildUnsubscribeUrl, replacePlaceholders } from '@/lib/email-utils'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET
  // In production the cron secret must be configured. If it is absent
  // (local development) the endpoint stays open for manual draining.
  if (!expected) return true
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${expected}`
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const dailyLimit = parseInt(process.env.EMAIL_DAILY_LIMIT || '100', 10) || 100

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const sentToday = await prisma.emailMessage.count({
      where: { status: 'SENT', sentAt: { gte: startOfDay } },
    })

    let remaining = Math.max(0, dailyLimit - sentToday)
    if (remaining <= 0) {
      return NextResponse.json({ success: true, claimed: 0, sent: 0, sentToday })
    }

    const client = resend()
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'RESEND_API_KEY သတ်မှတ်မထားပါ။' },
        { status: 500 }
      )
    }

    const from = emailFrom()
    let claimedTotal = 0
    let sentTotal = 0
    let firstError: string | null = null

    // Loop: drain the queue in batches of 100 (Resend batch call limit)
    // until the daily limit is reached or no PENDING messages remain.
    // This lets a single daily cron run (Hobby plan) flush the whole
    // EMAIL_DAILY_LIMIT, e.g. 2000/day on a Resend Pro month.
    while (remaining > 0) {
      const pending = await prisma.emailMessage.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: Math.min(remaining, 100),
      })

      if (pending.length === 0) break

      claimedTotal += pending.length

      const messages = pending.map((msg) => {
        const name = msg.name ?? ''
        const eventDate = msg.eventDate
          ? new Date(msg.eventDate).toLocaleDateString('en-US', {
              timeZone: 'Asia/Yangon',
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : ''

        const values = {
          name,
          eventTitle: msg.eventTitle ?? '',
          eventDate,
        }

        return {
          from,
          to: msg.to,
          subject: replacePlaceholders(msg.subject, values),
          html: buildEmailHtml({
            name: msg.name,
            body: replacePlaceholders(msg.body, values),
            unsubscribeUrl: buildUnsubscribeUrl(msg.to),
          }),
        }
      })

      const result = await client.batch.send(messages)
      const ids = pending.map((m) => m.id)

      if (result.error) {
        // A batch failure is usually systemic (quota, auth, network) —
        // stop looping so we don't hammer the API.
        firstError = result.error.message
        console.error('Resend batch send error:', result.error)
        await Promise.all(
          pending.map((msg) =>
            prisma.emailMessage.update({
              where: { id: msg.id },
              data: {
                attempts: { increment: 1 },
                lastError: result.error?.message || 'Unknown error',
                status: msg.attempts + 1 >= 5 ? 'FAILED' : 'PENDING',
              },
            })
          )
        )
        break
      }

      await prisma.emailMessage.updateMany({
        where: { id: { in: ids } },
        data: { status: 'SENT', sentAt: new Date(), lastError: null },
      })

      sentTotal += pending.length
      remaining -= pending.length
    }

    if (firstError) {
      return NextResponse.json(
        { success: false, claimed: claimedTotal, sent: sentTotal, error: firstError },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      claimed: claimedTotal,
      sent: sentTotal,
      sentToday: sentToday + sentTotal,
    })
  } catch (error) {
    console.error('Cron send emails failed:', error)
    return NextResponse.json(
      { success: false, error: 'Email ပို့ခြင်း လုပ်ငန်းစဉ် မအောင်မြင်ပါ။' },
      { status: 500 }
    )
  }
}
