'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import CreateEventForm from './createEventForm'


export default function CreateEventButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div>
      {/* Create Event Trigger Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-indigo-600/20 transition cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Create Event</span>
      </button>

      {/* Responsive Modal Backdrop & Container */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          
          {/* Overlay Click ပြုလုပ်ပါက Modal ပိတ်ရန် */}
          <div 
            className="fixed inset-0" 
            onClick={() => setIsModalOpen(false)} 
          />

          {/* Modal Content Box */}
          <div className="relative z-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <CreateEventForm onClose={() => setIsModalOpen(false)} />
          </div>

        </div>
      )}
    </div>
  )
}