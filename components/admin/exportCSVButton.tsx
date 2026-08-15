'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download } from 'lucide-react'

type Props = {
  eventId: string
  label?: string
}

export default function ExportCSVButton({ eventId, label = 'Export CSV' }: Props) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/events/${eventId}/export`, {
        method: 'GET',
      })

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Login ပြန်လုပ်ပြီး ထပ်ကြိုးစားပါ။')
        } else if (response.status === 404) {
          toast.error('Event မတွေ့ပါ။')
        } else {
          toast.error('CSV Export မအောင်မြင်ပါ။')
        }
        return
      }

      const disposition = response.headers.get('content-disposition')
      const match = disposition?.match(/filename="?([^"]+)"?/)
      const filename = match?.[1] ?? `registrations-${new Date().toISOString().slice(0, 10)}.csv`

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('CSV File Download စတင်ပါပြီ။')
    } catch {
      toast.error('CSV Export မအောင်မြင်ပါ။')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-600/20 transition"
    >
      <Download className="w-4 h-4" />
      <span>{loading ? 'Exporting...' : label}</span>
    </button>
  )
}
