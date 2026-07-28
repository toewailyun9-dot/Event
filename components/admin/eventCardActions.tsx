'use client'

import { toast } from 'sonner'
import { toggleEventStatus } from '@/app/actions/event'
import { useTransition } from 'react'

type Props = {
    slug?: string,
    id: string,
    isActive: boolean
}
export default function EventCardActions({ slug ,id , isActive}: Props) {
  const handleCopyLink = () => {
    const origin = window.location.origin
    const fullUrl = `${origin}/events/${slug}`

    navigator.clipboard.writeText(fullUrl)
    toast.success('Registration Link ကို Copy ကူးပြီးပါပြီ!')
  }
const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleEventStatus(id, isActive)
      if (res.success) {
        toast.success(`Event ကို ${!isActive ? 'Active' : 'Closed'} ပြောင်းလဲလိုက်ပါပြီ`)
      } else {
        toast.error(res.error)
      }
    })
  }
  return (
    <div className='flex gap-2'>
    <button
      onClick={handleCopyLink}
      className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-lg transition"
    >
      Copy Link
    </button>
    <button
        onClick={handleToggle}
        disabled={isPending}
        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition flex items-center gap-1 ${
          isActive
            ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300'
            : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
        } disabled:opacity-50`}
      >
        {isPending ? 'Updating...' : isActive ? 'Close Event' : 'Make Active'}
      </button>
      </div>
  )
}