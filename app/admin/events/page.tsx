'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import EventCardActions from '@/components/admin/eventCardActions'
import CreateEventButton from '@/components/admin/createEventButton'
import EditEventButton from '@/components/admin/editEventButton'
import DeleteEventButton from '@/components/admin/deleteEventButton'
import EventInviteIcons from '@/components/admin/eventInviteIcons'
import { getEvents } from '@/app/actions/admin'
import { useDebounce } from '@/hooks/useDebounce'
import { Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 12

type EventRow = {
  id: string
  title: string
  location: string | null
  eventDate: Date
  isActive: boolean
  telegramLink: string | null
  viberLink: string | null
  _count: { registrations: number }
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getEvents({
        search: debouncedSearch || undefined,
        status,
        page,
        pageSize: PAGE_SIZE,
      })
      if (result.success && result.data) {
        setEvents(result.data)
        setTotal(result.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, status, page])

  // Search / Status ပြောင်းသည့်အခါ page ကို 1 သို့ ပြန်လည်သတ်မှတ်ရန်
  const [prevSearch, setPrevSearch] = useState(debouncedSearch)
  if (prevSearch !== debouncedSearch) {
    setPrevSearch(debouncedSearch)
    setPage(1)
  }

  const [prevStatus, setPrevStatus] = useState(status)
  if (prevStatus !== status) {
    setPrevStatus(status)
    setPage(1)
  }

  // Event create/edit/delete/toggle ပြီးသည့်အခါ စာရင်းကို refresh ပြန်လုပ်ရန်
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
    const onEventsChanged = () => {
      setPage(1)
      fetchData()
    }
    window.addEventListener('events-changed', onEventsChanged)
    return () => window.removeEventListener('events-changed', onEventsChanged)
  }, [fetchData])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="p-6 bg-card rounded-xl shadow-lg border border-border space-y-4">

          {/* Back Button */}
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Events Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                ဖန်တီးထားသော Event များနှင့် Registration စာရင်းများကို စီမံခန့်ခွဲပါ။
              </p>
            </div>
            <CreateEventButton />
          </div>
        </div>

        {/* Search + Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 border border-border rounded-xl">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Event Title သို့မဟုတ် နေရာဖြင့် ရှာမည်..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-indigo-500 transition"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'ALL' | 'ACTIVE' | 'CLOSED')}
              className="px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground outline-none focus:border-indigo-500 transition"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="CLOSED">Closed</option>
            </select>
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Event List Grid */}
        {loading ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Data များကို ရယူနေပါသည်...</span>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <p className="text-muted-foreground text-sm">
              {search || status !== 'ALL'
                ? 'ရှာဖွေတွေ့ရှိသည့် Event မရှိပါ။'
                : 'မရှိသေးပါ။ Event အသစ် စတင်ဖန်တီးပါ။'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-5 bg-card rounded-xl shadow-md border border-border flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-foreground line-clamp-1">
                      {event.title}
                    </h3>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        event.isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {event.isActive ? 'Active' : 'Closed'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <span>📅</span>
                      {new Date(event.eventDate).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                    {event.location && (
                      <p className="flex items-center gap-1.5">
                        <span>📍</span>
                        {event.location}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5">
                      <span>🔗</span>
                      <code className="text-foreground font-mono">
                        /events/{event.id}
                      </code>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span>💬</span>
                      <EventInviteIcons
                        telegramLink={event.telegramLink}
                        viberLink={event.viberLink}
                      />
                    </p>
                  </div>
                </div>

                {/* Event Card Bottom Actions */}
                <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-foreground">
                    {event._count.registrations}{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      Registrations
                    </span>
                  </div>

                  <div className="flex items-center flex-wrap gap-2">
                    {/* Toggle Button ပါဝင်သော Actions Component */}
                    <EventCardActions id={event.id} isActive={event.isActive} />

                    <Link
                      href={`/admin/events/${event.id}`}
                      className="px-3 py-1.5 bg-muted hover:bg-accent text-foreground text-xs font-medium rounded-lg transition"
                    >
                      View List
                    </Link>

                    <EditEventButton
                      event={{
                        id: event.id,
                        title: event.title,
                        eventDate: event.eventDate.toISOString(),
                        location: event.location,
                        telegramLink: event.telegramLink,
                        viberLink: event.viberLink,
                      }}
                    />
                    <DeleteEventButton
                      id={event.id}
                      title={event.title}
                      registrationCount={event._count.registrations}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="px-5 py-4 bg-card border border-border rounded-xl flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              စုစုပေါင်း {total} ခု
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
