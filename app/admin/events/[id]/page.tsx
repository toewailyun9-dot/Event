// app/admin/events/[id]/page.tsx

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Copy, 
  ExternalLink, 
  Search,
  UserCheck
} from "lucide-react";
import ExportCSVButton from "@/components/admin/exportCSVButton";

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Event Data နှင့် Registrations များကို ဆွဲယူခြင်း
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      registrations: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) {
    notFound();
  }

  const totalRegistrations = event.registrations.length;
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/events/${event.id}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation & Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/events"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${event.isActive ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                  {event.isActive ? 'Active Event' : 'Closed'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                {event.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Public Form ကြည့်မည်</span>
            </a>
            <ExportCSVButton eventId={id} />
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Total Registered */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-zinc-400 mb-3">
              <span className="text-xs font-medium">စုစုပေါင်း Registrations</span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">{totalRegistrations}</div>
            <p className="text-xs text-zinc-500 mt-1">လူဦးရေ စာရင်းသွင်းပြီးပါပြီ</p>
          </div>

          {/* Card 2: Date & Location */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-zinc-400 mb-3">
              <span className="text-xs font-medium">ကျင်းပမည့် ရက်စွဲ / နေရာ</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-sm font-semibold text-white">
              {new Date(event.eventDate).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>{event.location || "Online Event"}</span>
            </div>
          </div>

          {/* Card 3: Quick Share Link */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-zinc-400 mb-3">
              <span className="text-xs font-medium">Registration Link</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Copy className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="w-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">Public User များသို့ ပေးပို့ရန် Link</p>
          </div>
        </div>

        {/* Registration Table Section */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Table Header & Controls */}
          <div className="p-5 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                <span>Registrations စာရင်း</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Event သို့ တက်ရောက်ရန် စာရင်းပေးထားသူများ
              </p>
            </div>

            {/* Search Input Placeholder */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="အမည် သို့မဟုတ် Email ရှာမည်..."
                className="w-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 rounded-xl pl-9 pr-4 py-2 outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Registrations Data Table */}
          {event.registrations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-zinc-800 text-zinc-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm text-zinc-400">မည်သည့် Registration မျှ မရှိသေးပါ။</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/50 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-5">အမည်</th>
                    <th className="py-3.5 px-5">Email</th>
                    <th className="py-3.5 px-5">ဖုန်းနံပါတ်</th>
                    <th className="py-3.5 px-5">အသက်</th>
                    <th className="py-3.5 px-5">လိပ်စာ</th>
                    <th className="py-3.5 px-5 text-right">ရက်စွဲ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {event.registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-4 px-5 font-medium text-white">
                        {reg.fullName}
                      </td>
                      <td className="py-4 px-5 text-zinc-400">{reg.email}</td>
                      <td className="py-4 px-5">{reg.phone}</td>
                      <td className="py-4 px-5">
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                          {reg.age}
                        </span>
                      </td>
                      <td className="py-4 px-5 max-w-xs truncate text-zinc-400">
                        {reg.address}
                      </td>
                      <td className="py-4 px-5 text-right text-zinc-500">
                        {new Date(reg.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}