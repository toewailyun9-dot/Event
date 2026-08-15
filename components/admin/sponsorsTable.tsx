'use client'

import { useCallback, useEffect, useState } from 'react'
import { Search, Globe, Mail, Building2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import EditSponsorButton from '@/components/admin/editSponsorButton'
import DeleteSponsorButton from '@/components/admin/deleteSponsorButton'
import { getSponsors } from '@/app/actions/sponsor'
import { useDebounce } from '@/hooks/useDebounce'

const PAGE_SIZE = 20

export type SponsorRow = {
  id: string
  name: string
  website: string | null
  description: string | null
  contactEmail: string | null
  contactName: string | null
  contactPhone: string | null
  createdAt: string
  eventCount: number
}

export default function SponsorsTable() {
  const [sponsors, setSponsors] = useState<SponsorRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getSponsors({
        search: debouncedSearch || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      if (result.success && result.data) {
        setSponsors(
          result.data.map((s) => ({
            id: s.id,
            name: s.name,
            website: s.website,
            description: s.description,
            contactEmail: s.contactEmail,
            contactName: s.contactName,
            contactPhone: s.contactPhone,
            createdAt: s.createdAt.toISOString(),
            eventCount: s._count.events,
          }))
        )
        setTotal(result.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page])

  // Search ပြောင်းသည့်အခါ page ကို 1 သို့ ပြန်လည်သတ်မှတ်ရန်
  const [prevSearch, setPrevSearch] = useState(debouncedSearch)
  if (prevSearch !== debouncedSearch) {
    setPrevSearch(debouncedSearch)
    setPage(1)
  }

  // Sponsor create/edit/delete ပြီးသည့်အခါ ဇယားကို refresh ပြန်လုပ်ရန်
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
    const onSponsorsChanged = () => {
      setPage(1)
      fetchData()
    }
    window.addEventListener('sponsors-changed', onSponsorsChanged)
    return () => window.removeEventListener('sponsors-changed', onSponsorsChanged)
  }, [fetchData])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="အမည်၊ Email သို့မဟုတ် ဖုန်းနံပါတ်ဖြင့် ရှာမည်..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-amber-500 transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">စုစုပေါင်း {total} ခု</span>
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted text-muted-foreground uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-5">Company</th>
              <th className="py-3.5 px-5">Contact</th>
              <th className="py-3.5 px-5">Events</th>
              <th className="py-3.5 px-5">Created</th>
              <th className="py-3.5 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-muted-foreground">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                    <span>Data များကို ရယူနေပါသည်...</span>
                  </div>
                </td>
              </tr>
            ) : sponsors.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  {search ? 'Sponsor ရှာမတွေ့ပါ။' : 'Sponsor Company မရှိသေးပါ။ Sponsor အသစ် စတင်ဖန်တီးပါ။'}
                </td>
              </tr>
            ) : (
              sponsors.map((s) => (
                <tr key={s.id} className="hover:bg-accent transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {s.name}
                        </p>
                        {s.description && (
                          <p className="text-xs text-muted-foreground max-w-xs truncate mt-0.5">
                            {s.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="space-y-1">
                      {s.contactName && (
                        <p className="text-muted-foreground">{s.contactName}</p>
                      )}
                      {s.contactPhone && (
                        <p className="text-muted-foreground">{s.contactPhone}</p>
                      )}
                      {s.contactEmail && (
                        <p className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {s.contactEmail}
                        </p>
                      )}
                      {s.website && (
                        <p className="flex items-center gap-1.5 text-muted-foreground">
                          <Globe className="w-3 h-3" />
                          <span className="truncate max-w-48">{s.website}</span>
                        </p>
                      )}
                      {!s.contactName && !s.contactPhone && !s.contactEmail && !s.website && (
                        <span>—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="inline-flex px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 font-medium">
                      {s.eventCount} Event(s)
                    </span>
                  </td>
                  <td className="py-4 px-5 text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <EditSponsorButton
                        sponsor={{
                          id: s.id,
                          name: s.name,
                          website: s.website,
                          description: s.description,
                          contactEmail: s.contactEmail,
                          contactName: s.contactName,
                          contactPhone: s.contactPhone,
                        }}
                      />
                      <DeleteSponsorButton id={s.id} name={s.name} eventCount={s.eventCount} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="px-5 py-4 border-t border-border flex items-center justify-between">
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
  )
}
