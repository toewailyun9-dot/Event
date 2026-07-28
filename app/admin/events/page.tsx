import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import EventCardActions from '@/components/admin/eventCardActions'
import CreateEventButton from '@/components/admin/createEventButton'

export const revalidate = 0 // Data အမြဲတမ်း Fresh ဖြစ်နေစေရန်

export default async function AdminEventsPage() {
  // Database မှ Event များအားလုံးကို Registrations အရေအတွက်နှင့်တကွ ဆွဲထုတ်ခြင်း
  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { registrations: true },
      },
    },
  })

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-800 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
          
          {/* Back Button */}
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
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
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Events Management
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                ဖန်တီးထားသော Event များနှင့် Registration စာရင်းများကို စီမံခန့်ခွဲပါ။
              </p>
            </div>
            <CreateEventButton />
          </div>
        </div>

        {/* Event List Grid */}
        {events.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              မရှိသေးပါ။ Event အသစ် စတင်ဖန်တီးပါ။
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-5 bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                      {event.title}
                    </h3>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        event.isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {event.isActive ? 'Active' : 'Closed'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
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
                      <code className="text-zinc-700 dark:text-zinc-300 font-mono">
                        /events/{event.slug}
                      </code>
                    </p>
                  </div>
                </div>

                {/* Event Card Bottom Actions */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {event._count.registrations}{' '}
                    <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      Registrations
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle Button ပါဝင်သော Actions Component */}
                    <EventCardActions id={event.id} isActive={event.isActive} />
                    
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-medium rounded-lg transition"
                    >
                      View List
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}