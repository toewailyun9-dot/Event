'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateEvent } from '@/app/actions/event'
import { X, Loader2 } from 'lucide-react'

export type EventData = {
  id: string
  title: string
  slug: string
  eventDate: string
  location: string | null
  telegramLink: string | null
  viberLink: string | null
}

interface EditEventFormProps {
  event: EventData
  onClose?: () => void
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EditEventForm({ event, onClose }: EditEventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState(event.title)
  const [slug, setSlug] = useState(event.slug)
  const [eventDate, setEventDate] = useState(toLocalInputValue(new Date(event.eventDate)))
  const [location, setLocation] = useState(event.location ?? '')
  const [telegramLink, setTelegramLink] = useState(event.telegramLink ?? '')
  const [viberLink, setViberLink] = useState(event.viberLink ?? '')

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    setSlug(
      newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateEvent(event.id, {
        title,
        slug,
        eventDate: new Date(eventDate),
        location,
        telegramLink,
        viberLink,
      })

      if (result.success) {
        toast.success('Event ပြင်ဆင်ခြင်း အောင်မြင်ပါသည်။')
        if (onClose) onClose()
        router.refresh()
      } else {
        toast.error(result.error || 'အမှားအယွင်းဖြစ်ပွားခဲ့ပါသည်။')
      }
    } catch (error) {
      toast.error('Server နှင့် ချိတ်ဆက်ရာတွင် အမှားအယွင်းဖြစ်ပွားခဲ့ပါသည်။')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Modal Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Edit Event
        </h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Modal Body / Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Event Title Field */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Event Title
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={handleTitleChange}
            placeholder="Tech Summit 2026"
            className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
          />
        </div>

        {/* Slug Link Field */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            URL Link (Slug)
          </label>
          <div className="flex items-center">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-r-0 border-zinc-300 dark:border-zinc-700 rounded-l-lg px-2.5 py-2 h-9.5 flex items-center select-none">
              /events/
            </span>
            <input
              id="slug"
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="tech-summit-2026"
              className="w-full px-3 py-2 border rounded-r-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
          </div>
        </div>

        {/* Date and Location Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Event Date Field */}
          <div>
            <label htmlFor="eventDate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Event Date & Time
            </label>
            <input
              id="eventDate"
              type="datetime-local"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 scheme-light dark:scheme-dark"
            />
          </div>

          {/* Location Field */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Novotel Yangon Max"
              className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
          </div>
        </div>

        {/* Telegram and Viber Invite Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="telegramLink" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Telegram Group Link
            </label>
            <input
              id="telegramLink"
              type="url"
              value={telegramLink}
              onChange={(e) => setTelegramLink(e.target.value)}
              placeholder="https://t.me/yourgroup"
              className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Registration အောင်မြင်သည့်စာမျက်နှာတွင် ပြသမည်။ မဖြည့်လိုပါက ချန်ထားနိုင်သည်။
            </p>
          </div>

          <div>
            <label htmlFor="viberLink" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Viber Group Link
            </label>
            <input
              id="viberLink"
              type="url"
              value={viberLink}
              onChange={(e) => setViberLink(e.target.value)}
              placeholder="https://invite.viber.com/..."
              className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Registration အောင်မြင်သည့်စာမျက်နှာတွင် ပြသမည်။ မဖြည့်လိုပါက ချန်ထားနိုင်သည်။
            </p>
          </div>
        </div>

        {/* Action Buttons / Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
