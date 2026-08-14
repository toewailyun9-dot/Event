import type { SVGProps } from "react";

function TelegramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function ViberIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M11.4 0C5.4.3 1.7 3.6 1.6 8.5c0 2.6 1.2 4.9 3.1 6.5.2.2.3.5.2.8l-.3 1.7c-.1.4.3.8.7.6l1.9-.9c.2-.1.4-.1.6 0 .9.4 1.9.6 2.9.6.1 0 .2 0 .3-.1 5.7.3 9-3.3 9.2-8.7C20.5 3.9 17.4 0 11.4 0zm3.8 12.7c-.2.7-.8 1.1-1.5 1.3-.6.1-1.1.2-2.4-.5-2-1.1-3.4-2.7-4.1-4.2-.4-.9-.5-1.6-.3-2.2.2-.7.8-1.2 1.4-1.4.2-.1.4-.1.6 0 .2.1.3.4.4.7.1.3.2.6.3.9.1.2.1.5 0 .7-.1.2-.2.3-.4.5-.2.1-.4.3-.3.5.4.8 1.3 1.7 2.2 2.3.4.3.7.5.9.5.1 0 .3-.1.4-.2.2-.3.4-.6.6-.8.2-.3.4-.3.6-.2l1.7.9c.3.1.4.3.4.6z" />
    </svg>
  );
}

export default function EventInviteIcons({
  telegramLink,
  viberLink,
}: {
  telegramLink: string | null;
  viberLink: string | null;
}) {
  return (
    <div className="flex items-center gap-2">
      {telegramLink ? (
        <a
          href={telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          title="Telegram Group"
          aria-label="Telegram Group"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc] hover:text-white transition cursor-pointer"
        >
          <TelegramIcon className="w-4 h-4" />
        </a>
      ) : (
        <span
          title="Telegram Link မရှိသေးပါ"
          aria-label="Telegram Link မရှိသေးပါ"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
        >
          <TelegramIcon className="w-4 h-4" />
        </span>
      )}

      {viberLink ? (
        <a
          href={viberLink}
          target="_blank"
          rel="noopener noreferrer"
          title="Viber Group"
          aria-label="Viber Group"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#7360F2]/10 text-[#7360F2] hover:bg-[#7360F2] hover:text-white transition cursor-pointer"
        >
          <ViberIcon className="w-4 h-4" />
        </a>
      ) : (
        <span
          title="Viber Link မရှိသေးပါ"
          aria-label="Viber Link မရှိသေးပါ"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
        >
          <ViberIcon className="w-4 h-4" />
        </span>
      )}
    </div>
  );
}
