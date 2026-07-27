"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createRegistration } from "./actions/registration";
import { toast } from "sonner";

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
    .min(1, { message: "အသက်သည် အနည်းဆုံး 10 နှစ် ဖြစ်ရပါမည်။" })
    .max(120, { message: "မှန်ကန်သော အသက်ကို ထည့်သွင်းပါ။" }),
  phone: z.string().min(8, {
    message: "မှန်ကန်သော ဖုန်းနံပါတ် ထည့်သွင်းပါ။",
  }),
  address: z.string().min(5, {
    message: "လိပ်စာသည် အနည်းဆုံး ၅ လုံး ရှိရပါမည်။",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function Page() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormValues) => {
  const result = await createRegistration(data)
    
   if (result.success) {
    toast.success('Registration အောင်မြင်ပါသည်။');
   
  } else {
    toast.error(result.error || 'တစ်စုံတစ်ခု မှားယွင်းနေပါသည်။');
  }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
    <div className="max-w-md  mx-auto p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
        Simple Event Form
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Name
          </label>
          <input
            type="text"
            placeholder="မောင်မောင်"
            {...register("name")}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
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
            {...register("email")}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
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
              {...register("age")}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
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
              {...register("phone")}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
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
            {...register("address")}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 resize-none"
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
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-medium rounded-lg text-sm transition disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Registration"}
        </button>
      </form>
    </div>
    </div>
  );
}