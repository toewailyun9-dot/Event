'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteEvent } from '@/app/actions/event'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

type Props = {
  id: string
  title: string
  registrationCount?: number
}

export default function DeleteEventButton({ id, title, registrationCount = 0 }: Props) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const result = await deleteEvent(id)
      if (result.success) {
        toast.success('Event ဖျက်လိုက်ပါပြီ။')
        setConfirmOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || 'ဖျက်၍ မရပါ။')
      }
    } catch {
      toast.error('Server နှင့် ချိတ်ဆက်ရာတွင် အမှားအယွင်းဖြစ်ပွားခဲ့ပါသည်။')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900/50 transition cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete</span>
      </button>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className="fixed inset-0"
            onClick={() => !loading && setConfirmOpen(false)}
          />
          <div className="relative z-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-red-500/10 text-red-500 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Delete Event?
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{title}</span> ကို ဖျက်မှာသေချာပါသလား?
                  </p>
                  {registrationCount > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      ဤ Event အောက်ရှိ Registrations ({registrationCount}) ခုပါ တစ်ပါတည်း ဖျက်ပစ်မည်။ ပြန်ပြောင်း၍ မရပါ။
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="py-2 px-4 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete Event'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
