'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import dynamic from 'next/dynamic'

const SponsorForm = dynamic(() => import('./sponsorForm'), {
  ssr: false,
  loading: () => null,
})

export default function CreateSponsorButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-amber-600/20 transition cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Create Sponsor</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0" onClick={() => setIsModalOpen(false)} />
          <div className="relative z-10 bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <SponsorForm onClose={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}