'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { deleteRegistration, getRegistrations, getEventsForFilter } from '../actions/admin'
import Link from 'next/link'
import {
  Users,
  Calendar,
  Search,
  RefreshCw,
  Trash2,
  Download,
  UserCheck,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarRange,
  Mail,
} from 'lucide-react'

import CreateEventButton from '@/components/admin/createEventButton'
import ImportCSVButton from '@/components/admin/importCSVButton'
import { useDebounce } from '@/hooks/useDebounce'
import { csvCell, csvField } from '@/lib/csv'

type Registration = {
  id: string
  fullName: string
  email: string
  age: number
  phone: string
  address: string
  createdAt: Date
  event?: { title: string } | null
}

type EventOption = {
  id: string
  title: string
  isActive: boolean
}

const PAGE_SIZE = 50

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [events, setEvents] = useState<EventOption[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [filterEventId, setFilterEventId] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  useEffect(() => {
    getEventsForFilter().then((result) => {
      if (result.success && result.data) setEvents(result.data)
    })
  }, [])

  const fetchData = useCallback(async (searchVal: string, pageNum: number, filters?: { eventId?: string; dateFrom?: string; dateTo?: string }) => {
    setLoading(true)
    try {
      const result = await getRegistrations({
        search: searchVal || undefined,
        page: pageNum,
        pageSize: PAGE_SIZE,
        eventId: filters?.eventId || undefined,
        dateFrom: filters?.dateFrom || undefined,
        dateTo: filters?.dateTo || undefined,
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
  }, [])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    fetchData(debouncedSearch, page, {
      eventId: filterEventId,
      dateFrom: filterDateFrom,
      dateTo: filterDateTo,
    })
  }, [fetchData, debouncedSearch, page, filterEventId, filterDateFrom, filterDateTo])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const hasActiveFilters = filterEventId || filterDateFrom || filterDateTo

  const clearFilters = () => {
    setFilterEventId('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setPage(1)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ဒီ Registration ကို ဖျက်ရန် သေချာပါသလား?')) return

    setDeletingId(id)
    const result = await deleteRegistration(id)
    if (result.success) {
      toast.success('ဖျက်ထုတ်ပြီးပါပြီ။')
      setRegistrations((prev) => prev.filter((item) => item.id !== id))
      setTotal((prev) => prev - 1)
    } else {
      toast.error(result.error || 'ဖျက်၍ မရပါ။')
    }
    setDeletingId(null)
  }

  const exportToCSV = () => {
    if (registrations.length === 0) {
      toast.error('Export လုပ်ရန် Data မရှိပါ။')
      return
    }

    const BOM = '\uFEFF'
    const headers = ['Name,Email,Age,Phone,Address,Registered Date\n']
    const csvRows = registrations.map((item) =>
      [
        csvField(item.fullName),
        csvField(item.email),
        item.age,
        csvCell(item.phone),
        csvField(item.address),
        csvField(new Date(item.createdAt).toLocaleDateString()),
      ].join(',')
    )

    const blob = new Blob([BOM + headers + csvRows.join('\n')], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    toast.success('CSV File Download စတင်ပါပြီ။')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-indigo-400" />
              <span>Event Registrations Dashboard</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              စာရင်းသွင်းထားသူများ၏ စာရင်းကို စစ်ဆေးခြင်းနှင့် စီမံခန့်ခွဲခြင်းများ ပြုလုပ်နိုင်ပါသည်။
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/events"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-medium hover:bg-zinc-800 transition"
            >
              <Calendar className="w-4 h-4" />
              <span>Events</span>
            </Link>

            <Link
              href="/admin/emails"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-medium hover:bg-zinc-800 transition"
            >
              <Mail className="w-4 h-4" />
              <span>Emails</span>
            </Link>

            <CreateEventButton />

            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-medium hover:bg-zinc-800 transition"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <ImportCSVButton eventId={filterEventId || undefined} />

            <button
              onClick={() => fetchData(debouncedSearch, page)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-medium hover:bg-zinc-800 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium">Total Registrations</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">{total}</p>
            <p className="text-xs text-zinc-500 mt-1">စုစုပေါင်း စာရင်းပေးသူ ဦးရေ</p>
          </div>

          <div className="p-5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium">Average Age</span>
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">
              {registrations.length > 0
                ? Math.round(
                    registrations.reduce((acc, curr) => acc + curr.age, 0) /
                      registrations.length
                  )
                : 0}{' '}
              <span className="text-sm font-normal text-zinc-400">နှစ်</span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">ပျှမ်းမျှ အသက်အရွယ်</p>
          </div>

          <div className="p-5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium">Filtered Results</span>
              <Filter className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">{total}</p>
            <p className="text-xs text-zinc-500 mt-1">ရှာဖွေတွေ့ရှိသည့် အရေအတွက်</p>
          </div>
        </div>

        {/* Filter Toggle + Active Filter Badge */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition border ${
              hasActiveFilters
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="ml-1.5 text-xs bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded-full">
                {[filterEventId, filterDateFrom, filterDateTo].filter(Boolean).length}
              </span>
            )}
          </button>

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

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Event Filter */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5 font-medium">Event</label>
                <select
                  value={filterEventId}
                  onChange={(e) => { setFilterEventId(e.target.value); setPage(1) }}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none focus:border-indigo-500 transition"
                >
                  <option value="">All Events</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} {ev.isActive ? '' : '(Inactive)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5 font-medium">From Date</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1) }}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none focus:border-indigo-500 transition [color-scheme:dark]"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5 font-medium">To Date</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => { setFilterDateTo(e.target.value); setPage(1) }}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none focus:border-indigo-500 transition [color-scheme:dark]"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition px-2 py-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear All Filters</span>
              </button>
            )}
          </div>
        )}

        {/* Search + Pagination Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-zinc-900/80 p-4 border border-zinc-800 rounded-2xl">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="အမည်၊ Email သို့မဟုတ် ဖုန်းနံပါတ်ဖြင့် ရှာမည်..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-5">Name</th>
                  <th className="py-3.5 px-5">Email</th>
                  <th className="py-3.5 px-5">Age</th>
                  <th className="py-3.5 px-5">Phone</th>
                  <th className="py-3.5 px-5">Address</th>
                  <th className="py-3.5 px-5">Event</th>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                        <span>Data များကို ရယူနေပါသည်...</span>
                      </div>
                    </td>
                  </tr>
                ) : registrations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500">
                      မည်သည့် စာရင်းမှ မရှိသေးပါ။
                    </td>
                  </tr>
                ) : (
                  registrations.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-4 px-5 font-medium text-white">
                        {item.fullName}
                      </td>
                      <td className="py-4 px-5 text-zinc-400">{item.email}</td>
                      <td className="py-4 px-5">
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                          {item.age}
                        </span>
                      </td>
                      <td className="py-4 px-5">{item.phone}</td>
                      <td className="py-4 px-5 text-zinc-400 max-w-xs truncate">
                        {item.address}
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs max-w-[180px] truncate">
                          {item.event?.title ?? '—'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-zinc-500">
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-medium px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition disabled:opacity-50"
                        >
                          {deletingId === item.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
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
      </div>
    </div>
  )
}
