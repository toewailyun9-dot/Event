'use client'

import { useState, useEffect } from 'react'

import { toast } from 'sonner'
import { deleteRegistration, getRegistrations } from '../actions/admin'

type Registration = {
  id: string
  name: string
  email: string
  age: number
  phone: string
  address: string
  createdAt: Date
}

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Data များ လှမ်းယူခြင်း
  const fetchData = async () => {
    setLoading(true)
    const result = await getRegistrations()
    if (result.success && result.data) {
      setRegistrations(result.data)
    } else {
      toast.error(result.error || 'Data ရယူ၍ မရပါ။')
    }
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [])

  // Single Item Delete ပြုလုပ်ခြင်း
  const handleDelete = async (id: string) => {
    if (!confirm('ဒီ Registration ကို ဖျက်ရန် သေချာပါသလား?')) return

    const result = await deleteRegistration(id)
    if (result.success) {
      toast.success('ဖျက်ထုတ်ပြီးပါပြီ။')
      setRegistrations((prev) => prev.filter((item) => item.id !== id))
    } else {
      toast.error(result.error || 'ဖျက်၍ မရပါ။')
    }
  }

  // Search Filter ပြုလုပ်ခြင်း
  const filteredData = registrations.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.phone.includes(search)
  )

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Event Registrations Dashboard
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              စာရင်းသွင်းထားသူများ၏ စာရင်းကို ကြည့်ရှု စီမံနိုင်ပါသည်။
            </p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            Refresh Data
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Total Registrations
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {registrations.length}
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Average Age
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {registrations.length > 0
                ? Math.round(
                    registrations.reduce((acc, curr) => acc + curr.age, 0) /
                      registrations.length
                  )
                : 0}{' '}
              <span className="text-sm font-normal">years</span>
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Filter Results
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {filteredData.length}
            </p>
          </div>
        </div>

        {/* Control & Search Bar */}
        <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <input
            type="text"
            placeholder="Search by Name, Email, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 px-3 py-2 border rounded-lg text-sm bg-transparent outline-none border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
          />
        </div>

        {/* Table View */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-800/50 text-xs text-zinc-500 dark:text-zinc-400 uppercase">
                  <th className="py-3.5 px-4 font-semibold">Name</th>
                  <th className="py-3.5 px-4 font-semibold">Email</th>
                  <th className="py-3.5 px-4 font-semibold">Age</th>
                  <th className="py-3.5 px-4 font-semibold">Phone</th>
                  <th className="py-3.5 px-4 font-semibold">Address</th>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-zinc-500 dark:text-zinc-400"
                    >
                      Loading registrations...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-zinc-500 dark:text-zinc-400"
                    >
                      စာရင်း မရှိသေးပါ။
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                        {item.email}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                        {item.age}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                        {item.phone}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                        {item.address}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 text-xs">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/50 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}