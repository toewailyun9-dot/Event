'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { EventData } from './editEventForm'

const EditEventForm = dynamic(() => import('./editEventForm'), {
  ssr: false,
  loading: () => null,
})

export default function EditEventButton({ event }: { event: EventData }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-medium rounded-lg transition cursor-pointer"
      >
        <Pencil className="w-3.5 h-3.5" />
        <span>Edit</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative z-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <EditEventForm event={event} onClose={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
