"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Send, Phone, UserPlus } from "lucide-react";

interface SuccessData {
  eventTitle?: string | null;
  telegramLink?: string | null;
  viberLink?: string | null;
}

// sessionStorage ကို external store အဖြစ် ဖတ်ရန် —
// effect အတွင်း setState မလုပ်ဘဲ hydration-safe ဖြစ်သည်။
function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem("registration-success");
  } catch {
    return null;
  }
}

function getServerSnapshot(): string | null {
  return null;
}

export default function SuccessPage() {
  const router = useRouter();
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const data = useMemo<SuccessData | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SuccessData;
    } catch {
      return null;
    }
  }, [raw]);

  const hasLinks = Boolean(data?.telegramLink || data?.viberLink);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 p-4">
      <div className="w-full max-w-md mx-auto p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 text-center space-y-6">
        <div className="flex flex-col items-center gap-3">
          <CheckCircle2 className="w-16 h-16 text-emerald-500" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Registration အောင်မြင်ပါသည်။
          </h1>
          {data?.eventTitle && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {data.eventTitle} အတွက် စာရင်းသွင်းခြင်း ပြီးဆုံးပါပြီ။
            </p>
          )}
        </div>

        {hasLinks && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/80 space-y-3">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Event Group သို့ ဝင်ရောက်ရန်
            </p>

            {data?.telegramLink && (
              <a
                href={data.telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-lg text-white font-medium text-sm transition flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Telegram Group သို့ ဝင်ရောက်ရန်
              </a>
            )}

            {data?.viberLink && (
              <a
                href={data.viberLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-lg text-white font-medium text-sm transition flex items-center justify-center gap-2 bg-[#7360F2] hover:bg-[#634ddf] cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                Viber Group သို့ ဝင်ရောက်ရန်
              </a>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => router.replace("/")}
          className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-medium rounded-lg text-sm transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          အခြားသူ စာရင်းသွင်းရန်
        </button>
      </div>
    </div>
  );
}
