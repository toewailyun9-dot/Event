import { createHmac, timingSafeEqual } from "node:crypto";

const EMAIL_SECRET =
  process.env.AUTH_SECRET || "fallback-secret-change-in-production";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function replacePlaceholders(
  text: string,
  values: Record<string, string>
): string {
  let out = text;
  for (const [key, value] of Object.entries(values)) {
    out = out.replaceAll(`{${key}}`, value);
  }
  return out;
}

export function signUnsubscribeToken(email: string): string {
  return createHmac("sha256", EMAIL_SECRET).update(email).digest("hex");
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  try {
    const expected = signUnsubscribeToken(email);
    const a = Buffer.from(expected);
    const b = Buffer.from(token);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function buildUnsubscribeUrl(email: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  const params = new URLSearchParams({
    email,
    token: signUnsubscribeToken(email),
  });
  return `${base}/api/unsubscribe?${params.toString()}`;
}



export function buildEmailHtml(options: {
  name?: string | null;
  body: string;
  unsubscribeUrl: string;
}): string {
  const name = options.name ? escapeHtml(options.name) : "လေးစားအပ်ပါသော လူကြီးမင်း";
  const body = escapeHtml(options.body).replace(/\n/g, "<br />");

  return `<!DOCTYPE html>
<html lang="my">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Announcement</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding: 40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px; background-color:#ffffff; border:1px solid #e4e4e7; border-radius:16px; overflow:hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            
            <!-- Header Banner -->
            <tr>
              <td style="background-color:#18181b; padding:28px 32px; border-bottom: 3px solid #3b82f6;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <span style="color:#ffffff; font-size:18px; font-weight:700; letter-spacing:-0.3px;">Event Announcement</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Main Content Area -->
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 20px; color:#09090b; font-size:16px; font-weight:600; line-height:1.5;">
                  ${name}၊ မင်္ဂလာပါ။
                </p>
                
                <!-- Dynamic Content Box -->
                <div style="background-color:#fafafa; border:1px solid #f4f4f5; border-radius:12px; padding:20px; color:#27272a; font-size:15px; line-height:1.7;">
                  ${body}
                </div>
              </td>
            </tr>

            <!-- Footer Area -->
            <tr>
              <td style="padding:24px 32px; border-top:1px solid #f4f4f5; background-color:#fafafa; text-align:center;">
                <p style="margin:0 0 8px; color:#a1a1aa; font-size:12px;">
                  ဤအီးမေးလ်သည် Event နှင့် ပတ်သက်သော အရေးကြီး သတင်းအချက်အလက်များကို အသိပေးခြင်း ဖြစ်ပါသည်။
                </p>
                <a href="${options.unsubscribeUrl}" style="color:#71717a; font-size:12px; font-weight:500; text-decoration:underline;">
                  အီးမေးလ် လက်ခံရရှိမှုကို ရပ်ဆိုင်းရန် (Unsubscribe)
                </a>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}