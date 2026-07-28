"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { toast } from "sonner";
import { createRegistration } from "@/app/actions/registration";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useEffect } from "react";
import { syncOfflineRegistrations } from "@/lib/sync";
import { db } from "@/lib/db";

// Event Object Type Definition
export interface EventData {
  id: string;
  title: string;
  description?: string | null;
  eventDate: Date | string;
  location?: string | null;
}

interface EventRegistrationProps {
  event: EventData | null;
}

// Zod Validation Schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "အမည်သည် အနည်းဆုံး ၂ လုံး ရှိရပါမည်။",
  }),
  email: z.string().email({
    message: "မှန်ကန်သော Email လိပ်စာ ထည့်သွင်းပါ။",
  }),
  age: z.coerce
    .number({ invalid_type_error: "အသက်ကို ကိန်းဂဏန်းသာ ထည့်ပါ" })
    .min(10, { message: "အသက်သည် အနည်းဆုံး 10 နှစ် ဖြစ်ရပါမည်။" })
    .max(120, { message: "မှန်ကန်သော အသက်ကို ထည့်သွင်းပါ။" }),
  phone: z.string().min(8, {
    message: "မှန်ကန်သော ဖုန်းနံပါတ် ထည့်သွင်းပါ။",
  }),
  address: z.string().min(5, {
    message: "လိပ်စာသည် အနည်းဆုံး ၅ လုံး ရှိရပါမည်။",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function EventRegistrationForm({ event }: EventRegistrationProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });
const isOnline = useOnlineStatus();

  
  useEffect(() => {
    if (isOnline) {
      syncOfflineRegistrations();
    }

  }, [isOnline]);
const onSubmit = async (data: FormValues) => {
  if (!event?.id) return;

  // 1. Online ဟု ယူဆထားပါက Server Action ပို့ကြည့်မည်
  if (isOnline) {
    try {
      const result = await createRegistration({ eventId: event.id, ...data });

      if (result.success) {
        toast.success("Registration အောင်မြင်ပါသည်။");
        reset();
        return; // Success ဖြစ်ရင် ဒီမှာတင် ရပ်မည်
      } else {
        toast.error(result.error || "မှားယွင်းနေပါသည်။");
        return;
      }
    } catch (error) {
      // 💡 Server Action ကို Network Error ကြောင့် လှမ်းခေါ်မရပါက catch ထဲရောက်လာမည်
      // အောက်ပါ Offline Dexie Save logic သို့ ဆက်သွားပါမည်
      console.warn("Network Action failed, falling back to local Dexie storage.", error);
    }
  }

  // 2. Offline ဖြစ်နေလျှင် သို့မဟုတ် Server Action ခေါ်မရလျှင် IndexedDB (Dexie) ထဲသို့ သိမ်းမည်
  try {
    await db.pendingRegistrations.add({
      ...data,
      eventId: event.id,
      createdAt: new Date().toISOString(),
      synced: false,
    });

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-registrations');
        toast.warning("Offline သိမ်းဆည်းပြီးပါပြီ။ အင်တာနက်ရသည်နှင့် Auto Sync လုပ်ပေးပါမည်။");
      } catch (err) {
        toast.info("Data သိမ်းဆည်းပြီးပါပြီ။ App ပြန်ဖွင့်ချိန်တွင် Sync လုပ်ပေးပါမည်။");
      }
    } else {
      toast.info("Data သိမ်းဆည်းပြီးပါပြီ။ App ပြန်ဖွင့်ချိန်တွင် Sync လုပ်ပေးပါမည်။");
    }

    reset();
  } catch (dbError) {
    toast.error("Local Storage သို့ သိမ်းဆည်းရာတွင် အမှားဖြစ်ပေါ်နေပါသည်။");
  }
};

  const isFormDisabled = !event || isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 p-4">
      <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 space-y-6">
        <div className="flex items-center justify-between mb-4">
      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
        isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
      }`}>
        {isOnline ? '🌐 Online' : '📴 Offline Mode (Saved locally)'}
      </span>
    </div>
        {/* Active Event Information Banner */}
        {event ? (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Event
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                {event.title}
              </h2>
              {event.description && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                  {event.description}
                </p>
              )}
            </div>

            <div className="pt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-200/80 dark:border-zinc-700/60 font-medium">
              <div className="flex items-center gap-1.5">
                <span>📅</span>
                <span>
                  {new Date(event.eventDate).toLocaleDateString("en-US", {
                    dateStyle: "medium",
                  })}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-1.5">
                  <span>📍</span>
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-900/50 text-xs text-center space-y-1">
            <p className="font-semibold">လက်ရှိတွင် Active ဖြစ်နေသော Event မရှိသေးပါ။</p>
            <p className="text-amber-700/80 dark:text-amber-400/80">
              Event အသစ်ဖွင့်လှစ်ချိန်မှသာ Registration ပေးပို့နိုင်ပါမည်။
            </p>
          </div>
        )}

        {/* Form Title */}
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Registration Form
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Event တက်ရောက်ရန် အောက်ပါ အချက်အလက်များကို ဖြည့်သွင်းပါ။
          </p>
        </div>

        {/* Form Controls */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Name
            </label>
            <input
              type="text"
              placeholder="မောင်မောင်"
              disabled={isFormDisabled}
              {...register("name")}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="example@gmail.com"
              disabled={isFormDisabled}
              {...register("email")}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Grid for Age and Phone */}
          <div className="grid grid-cols-2 gap-4">
            {/* Age Field */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Age
              </label>
              <input
                type="number"
                placeholder="25"
                disabled={isFormDisabled}
                {...register("age")}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {errors.age && (
                <p className="text-xs text-red-500 mt-1">{errors.age.message}</p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Phone
              </label>
              <input
                type="text"
                placeholder="09xxxxxxxxx"
                disabled={isFormDisabled}
                {...register("phone")}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          {/* Address Field */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Address
            </label>
            <textarea
              rows={3}
              placeholder="ရန်ကုန်မြို့၊ ..."
              disabled={isFormDisabled}
              {...register("address")}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.address && (
              <p className="text-xs text-red-500 mt-1">
                {errors.address.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isFormDisabled}
            className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-medium rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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