import { prisma } from '@/lib/prisma'
import { verifyUnsubscribeToken } from '@/lib/email-utils'


export const dynamic = 'force-dynamic'

function page(title: string, message: string): Response {
  return new Response(
    `<!DOCTYPE html>
<html lang="my">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:420px;margin:48px auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">✉️</div>
      <h1 style="margin:0 0 8px;color:#18181b;font-size:18px;">${title}</h1>
      <p style="margin:0;color:#3f3f46;font-size:14px;line-height:1.7;">${message}</p>
    </div>
  </body>
</html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = (url.searchParams.get('email') || '').trim().toLowerCase()
  const token = url.searchParams.get('token') || ''

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return page('Invalid Link', 'ဤလင့်ခ်မှာ မမှန်ကန်ပါ။')
  }

  await prisma.unsubscribedEmail.upsert({
    where: { email },
    create: { email },
    update: {},
  })

  return page('Unsubscribed', `နောက်ထပ် သတင်းစာများကို ${email} ထံ ပို့လွှတ်ခြင်း ရပ်ဆိုင်းပြီးပါပြီ။`)
}

// Allow POST as well — some mail clients block GET links.
export async function POST(request: Request) {
  return GET(request)
}
