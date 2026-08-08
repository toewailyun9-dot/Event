import "server-only";
import { Resend } from "resend";

export function emailFrom(): string {
  return (
    process.env.EMAIL_FROM ||
    "Event Registration <onboarding@resend.dev>"
  );
}

export function resend(): Resend | undefined {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return undefined;
  return new Resend(apiKey);
}

export { escapeHtml, buildEmailHtml, signUnsubscribeToken, verifyUnsubscribeToken, buildUnsubscribeUrl } from "./email-utils";
