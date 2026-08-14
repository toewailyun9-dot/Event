'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Mail,
  Send,
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  getEmailMessages,
  previewEmailRecipients,
  sendEmailCampaign,
} from '@/app/actions/email'
import { getEventsForFilter } from '@/app/actions/admin'

type EventOption = { id: string; title: string; isActive: boolean }

type Message = {
  id: string
  to: string
  name: string | null
  subject: string
  status: 'PENDING' | 'SENT' | 'FAILED'
  attempts: number
  lastError: string | null
  sentAt: Date | null
  createdAt: Date
  event?: { title: string } | null
}

const PAGE_SIZE = 50

const statusStyles: Record<Message['status'], string> = {
  PENDING: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  SENT: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  FAILED: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
}

const statusLabels: Record<Message['status'], string> = {
  PENDING: 'Pending',
  SENT: 'Sent',
  FAILED: 'Failed',
}

export default function AdminEmailsPage() {
  const [events, setEvents] = useState<EventOption[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [preview, setPreview] = useState<{ count: number; eventTitle: string } | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [sending, setSending] = useState(false)

  const [messages, setMessages] = useState<Message[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)

  const fetchEvents = useCallback(async () => {
    const result = await getEventsForFilter()
    if (result.success && result.data) setEvents(result.data)
  }, [])

  const fetchMessages = useCallback(async () => {
    // setState ကို effect အတွင်း synchronously မခေါ်မိစေရန်
    // microtask ဖြင့် ရွှေ့ထားသည်။
    await Promise.resolve()
    setLoadingMessages(true)
    try {
      const result = await getEmailMessages({
        status: statusFilter || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      if (result.success && result.data) {
        setMessages(result.data)
        setTotal(result.total ?? 0)
      } else {
        toast.error(result.error || 'Message များ ရယူ၍ မရပါ။')
      }
    } catch {
      toast.error('Network Error ဖြစ်ပေါ်နေပါသည်။')
    } finally {
      setLoadingMessages(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Filter ပြောင်းသည့်အခါ page ကို 1 သို့ ပြန်လည်သတ်မှတ်ရန်
  // (Render အတွင်း state ပြင်ဆင်ခြင်း — React ၏ ထောက်ခံထားသော ပုံစံ)
  const [prevStatusFilter, setPrevStatusFilter] = useState(statusFilter)
  if (prevStatusFilter !== statusFilter) {
    setPrevStatusFilter(statusFilter)
    setPage(1)
  }

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const handlePreview = async () => {
    if (!selectedEventId) {
      toast.error('Event တစ်ခု ရွေးချယ်ပါ။')
      return
    }
    setPreviewing(true)
    try {
      const result = await previewEmailRecipients({ eventId: selectedEventId })
      if (result.success) {
        setPreview({ count: result.count, eventTitle: result.eventTitle })
      } else {
        toast.error(result.error || 'ရယူ၍ မရပါ။')
      }
    } finally {
      setPreviewing(false)
    }
  }

  const handleSend = async () => {
    if (!selectedEventId) {
      toast.error('Event တစ်ခု ရွေးချယ်ပါ။')
      return
    }
    if (!preview) {
      await handlePreview()
      return
    }

    const ok = confirm(
      `${preview.eventTitle} Event ၏ စာရင်းသွင်းသူ ${preview.count} ယောက်ထံ Email ပို့ရန် သေချာပါသလား?`
    )
    if (!ok) return

    setSending(true)
    try {
      const result = await sendEmailCampaign({
        eventId: selectedEventId,
        subject,
        body,
      })
      if (result.success) {
        toast.success(result.message || 'Email များ စာရင်းသွင်းပြီးပါပြီ။')
        setSubject('')
        setBody('')
        setPreview(null)
        setStatusFilter('PENDING')
        fetchMessages()
      } else {
        toast.error(result.error || 'ပို့၍ မရပါ။')
      }
    } finally {
      setSending(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Mail className="w-6 h-6 text-indigo-400" />
                <span>Email Messaging</span>
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Event စာရင်းသွင်းသူများထံ သတင်းစာ ပို့လွှတ်ခြင်း
              </p>
            </div>
          </div>

          <button
            onClick={() => { setStatusFilter(''); fetchMessages() }}
            disabled={loadingMessages}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-medium hover:bg-zinc-800 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingMessages ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Compose */}
          <div className="lg:col-span-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4 h-fit">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-400" />
              <span>Message ပို့မည်</span>
            </h2>

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5 font-medium">Event</label>
              <select
                value={selectedEventId}
                onChange={(e) => { setSelectedEventId(e.target.value); setPreview(null) }}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none focus:border-indigo-500 transition"
              >
                <option value="">Event ရွေးပါ...</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} {ev.isActive ? '' : '(Inactive)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5 font-medium">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="ဥပမာ - နောက်လာမည့် Event အကြောင်း အကြောင်းကြားစာ"
                maxLength={200}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5 font-medium">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={'Message စာသားရေးပါ... ({name}၊ {eventTitle}၊ {eventDate} သုံးနိုင်သည်)'}
                rows={7}
                maxLength={10000}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-500 transition resize-y"
              />
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handlePreview}
                disabled={previewing || !selectedEventId}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium transition disabled:opacity-50"
              >
                <Users className="w-4 h-4" />
                {previewing ? 'စစ်ဆေးနေသည်...' : 'လက်ခံသူ အရေအတွက် ကြည့်မည်'}
              </button>

              {preview && (
                <div className="px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 flex items-center justify-between">
                  <span>
                    <strong className="text-indigo-100">{preview.count}</strong> ယောက် — {preview.eventTitle}
                  </span>
                  <Users className="w-4 h-4" />
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={sending || !selectedEventId}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sending ? 'ပို့ရန် စာရင်းသွင်းနေသည်...' : 'Email ပို့မည်'}
              </button>

              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Email များကို background မှ ပို့ပြီး Resend ရဲ့ free tier (တစ်နေ့ 100 ခု) အတွင်း အလိုအလျောက်
                စီစဉ်ပေးပါသည်။ ပို့ပြီးသား / unsubscribed ဖြစ်သူများကို ထပ်ပို့မည်မဟုတ်ပါ။
              </p>
            </div>
          </div>

          {/* Messages list */}
          <div className="lg:col-span-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl h-fit">
            <div className="p-5 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>Sent Messages ({total})</span>
              </h2>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none focus:border-indigo-500 transition"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="SENT">Sent</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/50 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-5">Email</th>
                    <th className="py-3.5 px-5">Subject</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {loadingMessages ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-zinc-500">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                          <span>Data များကို ရယူနေပါသည်...</span>
                        </div>
                      </td>
                    </tr>
                  ) : messages.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-zinc-500">
                        မည်သည့် Message မျှ မရှိသေးပါ။
                      </td>
                    </tr>
                  ) : (
                    messages.map((msg) => (
                      <tr key={msg.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-medium text-white">{msg.to}</div>
                          <div className="text-zinc-500 text-[11px]">{msg.event?.title ?? '—'}</div>
                        </td>
                        <td className="py-4 px-5 max-w-55 truncate text-zinc-400">
                          {msg.subject}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] ${statusStyles[msg.status]}`}>
                            {statusLabels[msg.status]}
                            {msg.status === 'FAILED' && msg.attempts > 0 && (
                              <span className="ml-1 opacity-70">({msg.attempts})</span>
                            )}
                          </span>
                          {msg.status === 'FAILED' && msg.lastError && (
                            <div className="text-[10px] text-zinc-500 mt-0.5 max-w-45 truncate">
                              {msg.lastError}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right text-zinc-500">
                          {new Date(msg.sentAt ?? msg.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
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

            {total > 0 && (
              <div className="px-5 py-4 border-t border-zinc-800/60 flex items-center justify-between">
                <span className="text-xs text-zinc-500">စုစုပေါင်း {total} ခု</span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-30 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2">{page} / {totalPages}</span>
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
    </div>
  )
}
