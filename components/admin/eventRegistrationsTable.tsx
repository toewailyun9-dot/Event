'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  UserCheck,
  Users,
} from 'lucide-react'
import { getRegistrations } from '@/app/actions/admin'
import { useDebounce } from '@/hooks/useDebounce'

const PAGE_SIZE = 50

type Row = {
  id: string
  fullName: string
  email: string
  age: number
  phone: string
  address: string
  createdAt: Date
}

export default function EventRegistrationsTable({ eventId }: { eventId: string }) {
  const [registrations, setRegistrations] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const fetchData = useCallback(async () => {
    // setState ကို effect အတွင်း synchronously မခေါ်မိစေရန်
    // microtask ဖြင့် ရွှေ့ထားသည်။
    await Promise.resolve()
    setLoading(true)
    try {
      const result = await getRegistrations({
        eventId,
        search: debouncedSearch || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      if (result.success && result.data) {
        setRegistrations(result.data)
        setTotal(result.total ?? 0)
      } else {
        toast.error(result.error || 'Data ရယူ၍ မရပါ။')
      }
    } catch {
      toast.error('Network Error ဖြစ်ပေါ်နေပါသည်။')
    } finally {
      setLoading(false)
    }
  }, [eventId, debouncedSearch, page])

  // Search ပြောင်းသည့်အခါ page ကို 1 သို့ ပြန်လည်သတ်မှတ်ရန်
  // (Render အတွင်း state ပြင်ဆင်ခြင်း — React ၏ ထောက်ခံထားသော ပုံစံ)
  const [prevSearch, setPrevSearch] = useState(debouncedSearch)
  if (prevSearch !== debouncedSearch) {
    setPrevSearch(debouncedSearch)
    setPage(1)
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Table Header & Controls */}
      <div className="p-5 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <span>Registrations စာရင်း</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Event သို့ တက်ရောက်ရန် စာရင်းပေးထားသူများ ({total} ဦး)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="အမည်၊ Email သို့မဟုတ် ဖုန်းနံပါတ်ဖြင့် ရှာမည်..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 rounded-xl pl-9 pr-4 py-2 outline-none focus:border-indigo-500 transition"
            />
          </div>
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Registrations Data Table */}
      {registrations.length === 0 && !loading ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 bg-zinc-800 text-zinc-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm text-zinc-400">
            {search
              ? 'ရှာဖွေတွေ့ရှိသည့် Registration မရှိပါ။'
              : 'မည်သည့် Registration မျှ မရှိသေးပါ။'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/50 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-5">အမည်</th>
                <th className="py-3.5 px-5">Email</th>
                <th className="py-3.5 px-5">ဖုန်းနံပါတ်</th>
                <th className="py-3.5 px-5">အသက်</th>
                <th className="py-3.5 px-5">လိပ်စာ</th>
                <th className="py-3.5 px-5 text-right">ရက်စွဲ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Data များကို ရယူနေပါသည်...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-4 px-5 font-medium text-white">
                      {reg.fullName}
                    </td>
                    <td className="py-4 px-5 text-zinc-400">{reg.email}</td>
                    <td className="py-4 px-5">{reg.phone}</td>
                    <td className="py-4 px-5">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                        {reg.age}
                      </span>
                    </td>
                    <td className="py-4 px-5 max-w-xs truncate text-zinc-400">
                      {reg.address}
                    </td>
                    <td className="py-4 px-5 text-right text-zinc-500">
                      {new Date(reg.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="px-5 py-4 border-t border-zinc-800/60 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            စုစုပေါင်း {total} ခု
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-30 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-30 transition"
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
