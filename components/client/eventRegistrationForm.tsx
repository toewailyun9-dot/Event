"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createRegistration } from "@/app/actions/registration";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useEffect, useState } from "react";
import { requestOfflineSync, warnIfPendingQueueLarge } from "@/lib/sync";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

interface ActionResult {
  success: boolean;
  error?: string;
}

interface ActiveEvent {
  id: string;
  title: string;
  description?: string | null;
  eventDate: Date | string;
  location?: string | null;
  telegramLink?: string | null;
  viberLink?: string | null;
}

interface EventRegistrationFormProps {
  event?: ActiveEvent | null;
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "အမည်သည် အနည်းဆုံး ၂ လုံး ရှိရပါမည်။",
  }),
  email: z.string().email({
    message: "မှန်ကန်သော Email လိပ်စာ ထည့်သွင်းပါ။",
  }),
  age: z.coerce
    .number({ invalid_type_error: "အသက်ကို ကိန်းဂဏန်းသာ ထည့်ပါ" })
    .min(15, { message: "အသက်သည် အနည်းဆုံး 15 နှစ် ဖြစ်ရပါမည်။" })
    .max(80, { message: "မှန်ကန်သော အသက်ကို ထည့်သွင်းပါ။" }),
  phone: z.string().min(8, {
    message: "မှန်ကန်သော ဖုန်းနံပါတ် ထည့်သွင်းပါ။",
  }),
  address: z.string().min(5, {
    message: "လိပ်စာသည် အနည်းဆုံး ၅ လုံး ရှိရပါမည်။",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function EventRegistrationForm({ event: initialEvent }: EventRegistrationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(initialEvent ?? null);
  const [eventLoading, setEventLoading] = useState(!initialEvent);
  const pendingCount = useLiveQuery(() => db.pendingRegistrations.count(), []) ?? 0;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const isOnline = useOnlineStatus();

  // Registration အောင်မြင်ပါက success page သို့ ပို့ဆောင်ရန်။
  // Event အချက်အလက်များကို sessionStorage တွင် ထည့်ထားပြီး
  // success page က offline ဖြစ်နေသော်လည်း Invite Link များ ပြသနိုင်သည်။
  const goToSuccess = () => {
    try {
      sessionStorage.setItem(
        "registration-success",
        JSON.stringify({
          eventTitle: activeEvent?.title ?? null,
          telegramLink: activeEvent?.telegramLink ?? null,
          viberLink: activeEvent?.viberLink ?? null,
        })
      );
    } catch {
      // sessionStorage မရနိုင်ပါက success page သည် generic state ကိုသာ ပြမည်။
    }
    router.replace("/success");
  };

  useEffect(() => {
    if (isOnline) {
      requestOfflineSync();
    }
  }, [isOnline]);

 useEffect(() => {
  if (initialEvent) return;

  if (!isOnline) {
    const timer = setTimeout(() => setEventLoading(false), 0);
    return () => clearTimeout(timer);
  }

  let isMounted = true;

  fetch("/api/events/active")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (isMounted && data?.event) setActiveEvent(data.event);
    })
    .catch(() => {})
    .finally(() => {
      if (isMounted) setEventLoading(false);
    });

  return () => {
    isMounted = false;
  };
}, [isOnline, initialEvent]);


  const handleOfflineSave = async (data: FormValues, eventId: string | undefined) => {
    try {
      const syncId = crypto.randomUUID();

      await db.pendingRegistrations.add({
        ...data,
        syncId,
        eventId: eventId ?? "",
        createdAt: new Date().toISOString(),
        synced: false,
      });

      toast.success("register ဖြည့်ခြင်း အောင်မြင် ပါသည်။ အင်တာနက်ရသည်နှင့် ပေးပို့ပါမည်။", { icon: "📥" });

      // Warn the operator if a lot of unsynced records are accumulating locally
      // (browsers have limited IndexedDB storage, so this prevents a full
      // browser quota from silently dropping new offline entries).
      await warnIfPendingQueueLarge();

      if ("serviceWorker" in navigator && "SyncManager" in window) {
        try {
          const swTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("SW ready timeout")), 2000)
          );
          const registration = (await Promise.race([
            navigator.serviceWorker.ready,
            swTimeout,
          ])) as  ServiceWorkerRegistration;

          await registration.sync.register("sync-registrations");
        } catch (err) {
          console.warn("SW Sync registration skipped (offline or timeout):", err);
        }
      }

      reset();
      goToSuccess();
    } catch (dbError) {
      console.error("Dexie Save Error:", dbError);
      toast.error("Local Storage သို့ သိမ်းဆည်းရာတွင် အမှားဖြစ်ပေါ်နေပါသည်။");
    }
  };

  const onSubmit = async (data: FormValues) => {
    setLoading(true);

    try {
      const isReallyOnline = typeof window !== "undefined" && navigator.onLine && isOnline;

      if (!isReallyOnline) {
        await handleOfflineSave(data, activeEvent?.id);
        return;
      }

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Network timeout")), 3000)
      );

      const result = (await Promise.race([
        createRegistration({ ...data, eventId: activeEvent?.id }),
        timeoutPromise,
      ])) as ActionResult ;

      if (result.success) {
        toast.success("Registration အောင်မြင်ပါသည်။");
        reset();
        goToSuccess();
      } else {
        toast.error(result.error || "မှားယွင်းနေပါသည်။");
      }
    } catch (error) {
      console.warn("Network error/timeout, falling back to IndexedDB:", error);
      await handleOfflineSave(data, activeEvent?.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md mx-auto p-6 bg-card rounded-xl shadow-lg border border-border space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium w-fit ${
              isOnline ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {isOnline ? "🌐 Online" : "📴 Offline Mode (Saved locally)"}
          </span>
          {pendingCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 w-fit animate-pulse flex items-center gap-1.5">
              <span>📤</span>
              မပို့ရသေးသော စာရင်း ({pendingCount}) ခု ရှိပါသည်
            </span>
          )}
        </div>

        {activeEvent ? (
          <div className="p-4 bg-muted rounded-xl border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Event
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground leading-snug">
                {activeEvent.title}
              </h2>
              {activeEvent.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {activeEvent.description}
                </p>
              )}
            </div>

            <div className="pt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground border-t border-border font-medium">
              <div className="flex items-center gap-1.5">
                <span>📅</span>
                <span>
                  {new Date(activeEvent.eventDate).toLocaleDateString("en-US", {
                    dateStyle: "medium",
                  })}
                </span>
              </div>
              {activeEvent.location && (
                <div className="flex items-center gap-1.5">
                  <span>📍</span>
                  <span>{activeEvent.location}</span>
                </div>
              )}
            </div>
          </div>
        ) : !eventLoading ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-900/50 text-sm text-center space-y-2">
            <div className="flex items-center justify-center gap-2 font-semibold">
              <span className="text-amber-500">⚠️</span>
              <p>အင်တာနက်လိုင်း ပြတ်တောက်နေပါသည်</p>
            </div>
            <p className="text-amber-700/80 dark:text-amber-400/80 text-xs leading-relaxed">
             သို့သော် ဖောင်ဆက်ဖြည့်နိုင်ပြီး အင်တာနက်ပြန်လည်ရရှိချိန်တွင် အလိုအလျောက် ပေးပို့ပေးပါမည်။
            </p>
          </div>
        ) : null}

        <div>
          <h3 className="text-base font-bold text-foreground">
            Registration Form
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Event တက်ရောက်ရန် အောက်ပါ အချက်အလက်များကို ဖြည့်သွင်းပါ။
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Name
            </label>
            <input
              type="text"
              placeholder="မောင်မောင်"
              disabled={loading}
              {...register("name")}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-foreground border-input text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="example@gmail.com"
              disabled={loading}
              {...register("email")}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-foreground border-input text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Age
              </label>
              <input
                type="number"
                placeholder="25"
                disabled={loading}
                {...register("age")}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-foreground border-input text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {errors.age && (
                <p className="text-xs text-red-500 mt-1">{errors.age.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Phone
              </label>
              <input
                type="text"
                placeholder="09xxxxxxxxx"
                disabled={loading}
                {...register("phone")}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-foreground border-input text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Address
            </label>
            <textarea
              rows={3}
              placeholder="ရန်ကုန်မြို့၊ ..."
              disabled={loading}
              {...register("address")}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-foreground border-input text-foreground resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.address && (
              <p className="text-xs text-red-500 mt-1">
                {errors.address.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-current"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Submitting...</span>
              </>
            ) : (
              "Submit Registration"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
