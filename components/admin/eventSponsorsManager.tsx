'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Globe,
  Plus,
  Loader2,
  Building2,
  Trash2,
  HandCoins,
} from 'lucide-react'
import { addSponsorToEvent, removeSponsorFromEvent, createSponsor } from '@/app/actions/sponsor'

export type EventSponsorItem = {
  id: string
  name: string
  website: string | null
  description: string | null
  contactEmail: string | null
  contactName: string | null
  contactPhone: string | null
  amount: string | null
}

export type SponsorOption = {
  id: string
  name: string
}

type Props = {
  eventId: string
  eventSponsors: EventSponsorItem[]
  allSponsors: SponsorOption[]
}

export default function EventSponsorsManager({ eventId, eventSponsors, allSponsors }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [creatingNew, setCreatingNew] = useState(false)
  const [sponsorId, setSponsorId] = useState('')
  const [amount, setAmount] = useState('')
  const [newName, setNewName] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')

  const availableSponsors = allSponsors.filter(
    (s) => !eventSponsors.some((es) => es.id === s.id)
  )

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sponsorId) {
      toast.error('Sponsor ကို ရွေးချယ်ပါ။')
      return
    }
    setLoading(true)
    try {
      const result = await addSponsorToEvent({
        eventId,
        sponsorId,
        amount: amount === '' ? undefined : Number(amount),
      })
      if (result.success) {
        toast.success('Sponsor ထည့်သွင်းပြီးပါပြီ။')
        resetForm()
        router.refresh()
      } else {
        toast.error(result.error || 'Sponsor ထည့်သွင်း၍ မရပါ။')
      }
    } catch {
      toast.error('Server နှင့် ချိတ်ဆက်ရာတွင် အမှားအယွင်းဖြစ်ပွားခဲ့ပါသည်။')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) {
      toast.error('Sponsor အမည် ထည့်သွင်းပါ။')
      return
    }
    setLoading(true)
    try {
      const result = await createSponsor({
        name: newName.trim(),
        contactEmail: newContactEmail || undefined,
      })
      if (result.success && result.data) {
        toast.success('Sponsor ဖန်တီးပြီးပါပြီ။')
        setCreatingNew(false)
        setNewName('')
        setNewContactEmail('')
        setSponsorId(result.data.id)
        router.refresh()
      } else {
        toast.error(result.error || 'Sponsor ဖန်တီး၍ မရပါ။')
      }
    } catch {
      toast.error('Server နှင့် ချိတ်ဆက်ရာတွင် အမှားအယွင်းဖြစ်ပွားခဲ့ပါသည်။')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" ကို ဤ Event မှ ဖယ်ရှားမည်လား?`)) return
    setLoading(true)
    try {
      const result = await removeSponsorFromEvent(eventId, id)
      if (result.success) {
        toast.success('Sponsor ဖယ်ရှားပြီးပါပြီ။')
        router.refresh()
      } else {
        toast.error(result.error || 'Sponsor ဖယ်ရှား၍ မရပါ။')
      }
    } catch {
      toast.error('Server နှင့် ချိတ်ဆက်ရာတွင် အမှားအယွင်းဖြစ်ပွားခဲ့ပါသည်။')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSponsorId('')
    setAmount('')
  }

  return (
    <section className="p-5 rounded-2xl bg-card border border-border backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <HandCoins className="w-5 h-5 text-amber-400" />
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Sponsors ({eventSponsors.length})
        </h2>
      </div>

      {/* Existing Sponsors List */}
      {eventSponsors.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-4">Sponsor များ မရှိသေးပါ။</p>
      ) : (
        <ul className="space-y-2 mb-5">
          {eventSponsors.map((sp) => (
            <li
              key={sp.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-muted border border-border"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{sp.name}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                    {sp.amount && (
                      <span className="inline-flex items-center gap-1">
                        <HandCoins className="w-3 h-3" />
                        {Number(sp.amount).toLocaleString()}
                      </span>
                    )}
                    {sp.contactName && <span>{sp.contactName}</span>}
                    {sp.contactPhone && <span>{sp.contactPhone}</span>}
                    {sp.website && (
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span className="truncate max-w-45">{sp.website}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(sp.id, sp.name)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add Sponsor Form (existing companies) */}
      {availableSponsors.length > 0 && (
        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3"
        >
          <div className="lg:col-span-2">
            <label className="block text-xs text-muted-foreground mb-1">Sponsor Company</label>
            <select
              value={sponsorId}
              onChange={(e) => setSponsorId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="">Select sponsor...</option>
              {availableSponsors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Amount</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex items-end justify-end">
            <button
              type="submit"
              disabled={loading || !sponsorId}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Sponsor
            </button>
          </div>
        </form>
      )}

      {/* Create New Sponsor Toggle */}
      <div className="border-t border-border pt-3">
        {creatingNew ? (
          <form onSubmit={handleCreateNew} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Company Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Tech Company Co., Ltd"
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Contact Email</label>
              <input
                type="email"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
                placeholder="contact@company.com"
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreatingNew(false)}
                disabled={loading}
                className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm font-medium transition cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Company
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setCreatingNew(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Create new sponsor company
          </button>
        )}
      </div>
    </section>
  )
}