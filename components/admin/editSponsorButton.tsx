'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { SponsorFormData } from './sponsorForm'

const SponsorForm = dynamic(() => import('./sponsorForm'), {
  ssr: false,
  loading: () => null,
})

export default function EditSponsorButton({ sponsor }: { sponsor: SponsorFormData }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-accent text-foreground text-xs font-medium rounded-lg transition cursor-pointer"
      >
        <Pencil className="w-3.5 h-3.5" />
        <span>Edit</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0" onClick={() => setIsModalOpen(false)} />
          <div className="relative z-10 bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <SponsorForm sponsor={sponsor} onClose={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}