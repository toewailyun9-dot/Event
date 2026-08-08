'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'
import { importRegistrations } from '@/app/actions/admin'
import { parseRegistrationsCsv } from '@/lib/csv-parse'

type Props = {
  eventId?: string
  label?: string
}

export default function ImportCSVButton({ eventId, label = 'Import CSV' }: Props) {
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setLoading(true)
    try {
      const text = await file.text()
      const parsed = parseRegistrationsCsv(text)

      if (parsed.rows.length === 0) {
        toast.error(parsed.errors[0]?.error || 'CSV ဖိုင်ထဲတွင် Data မရှိပါ။')
        return
      }

      const confirmed = window.confirm(
        `CSV ထဲမှ Data (${parsed.rows.length}) ခုကို ${
          eventId ? 'ရွေးထားသော Event' : 'Active Event'
        } ထဲသို့ Import လုပ်မည်လား?\n\nမှတ်ချက်: Email + Event တွဲ ထပ်နေသော Data များကို ကျော်သွားပါမည်။`
      )
      if (!confirmed) return

      const result = await importRegistrations({ eventId, rows: parsed.rows })

      if (!result.success) {
        toast.error(result.error || 'CSV Import မအောင်မြင်ပါ။')
        return
      }

      if (result.invalid > 0) {
        console.error('[CSV Import] Invalid rows:', result.errors)
      }

      if (result.imported > 0) {
        toast.success(
          `CSV Import ပြီးပါပြီ — ${result.imported} ခု ထည့်သွင်းပြီးပါပြီ။`
        )
      } else {
        toast.error('Import လုပ်ရန် Data အသစ် မရှိပါ။')
      }

      if (result.duplicates > 0 || result.invalid > 0) {
        const problems = result.duplicates + result.invalid
        toast.warning(`ထပ်နေသော / မမှန်သော Data (${problems}) ခု ကျော်သွားပါသည်။`)
      }
    } catch {
      toast.error('CSV ဖိုင်ကို ဖတ်၍ မရပါ။')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-600/20 transition"
      >
        <Upload className="w-4 h-4" />
        <span>{loading ? 'Importing...' : label}</span>
      </button>
    </>
  )
}
