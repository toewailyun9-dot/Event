'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Loader2 } from 'lucide-react'
import { createSponsor, updateSponsor } from '@/app/actions/sponsor'

export type SponsorFormData = {
  id?: string
  name: string
  website: string | null
  description: string | null
  contactEmail: string | null
  contactName: string | null
  contactPhone: string | null
}

interface SponsorFormProps {
  sponsor?: SponsorFormData
  onClose?: () => void
}

export default function SponsorForm({ sponsor, onClose }: SponsorFormProps) {
  const router = useRouter()
  const isEdit = Boolean(sponsor?.id)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState(sponsor?.name ?? '')
  const [website, setWebsite] = useState(sponsor?.website ?? '')
  const [description, setDescription] = useState(sponsor?.description ?? '')
  const [contactEmail, setContactEmail] = useState(sponsor?.contactEmail ?? '')
  const [contactName, setContactName] = useState(sponsor?.contactName ?? '')
  const [contactPhone, setContactPhone] = useState(sponsor?.contactPhone ?? '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        name,
        website: website || undefined,
        description: description || undefined,
        contactEmail: contactEmail || undefined,
        contactName: contactName || undefined,
        contactPhone: contactPhone || undefined,
      }

      const result = isEdit
        ? await updateSponsor(sponsor!.id!, payload)
        : await createSponsor(payload)

      if (result.success) {
        toast.success(isEdit ? 'Sponsor ပြင်ဆင်ပြီးပါပြီ။' : 'Sponsor ဖန်တီးပြီးပါပြီ။')
        if (onClose) onClose()
        router.refresh()
        window.dispatchEvent(new CustomEvent('sponsors-changed'))
      } else {
        toast.error(result.error || 'အမှားအယွင်းဖြစ်ပွားခဲ့ပါသည်။')
      }
    } catch {
      toast.error('Server နှင့် ချိတ်ဆက်ရာတွင် အမှားအယွင်းဖြစ်ပွားခဲ့ပါသည်။')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 border rounded-lg text-sm bg-transparent outline-none transition focus:ring-2 focus:ring-amber-500 border-input text-foreground placeholder:text-muted-foreground'

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">
          {isEdit ? 'Edit Sponsor' : 'Create Sponsor'}
        </h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
            Company Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tech Company Co., Ltd"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="contactEmail" className="block text-sm font-medium text-foreground mb-1">
            Contact Email
          </label>
          <input
            id="contactEmail"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="contact@company.com"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-foreground mb-1">
              Contact Name
            </label>
            <input
              id="contactName"
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="ဆက်သွယ်ရမည့် ပုဂ္ဂိုလ်"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium text-foreground mb-1">
              Contact Phone
            </label>
            <input
              id="contactPhone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="09-xxx-xxx-xxx"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-foreground mb-1">
            Website
          </label>
          <input
            id="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://www.company.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Company နှင့် ပတ်သက်သော ဖော်ပြချက်..."
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-input hover:bg-accent text-foreground rounded-lg text-sm font-medium transition cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="py-2 px-4 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isEdit ? 'Saving...' : 'Creating...'}</span>
              </>
            ) : (
              isEdit ? 'Save Changes' : 'Create Sponsor'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}