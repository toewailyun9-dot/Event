// app/admin/events/[id]/page.tsx

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 

  ExternalLink
} from "lucide-react";
import ExportCSVButton from "@/components/admin/exportCSVButton";
import ImportCSVButton from "@/components/admin/importCSVButton";
import EventRegistrationsTable from "@/components/admin/eventRegistrationsTable";

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Event Data နှင့် Registration အရေအတွက်ကို ဆွဲယူခြင်း
  // (Registration list ကို client-side table တွင် search/pagination ဖြင့် ပြသမည်)
  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      eventDate: true,
      location: true,
      isActive: true,
      _count: { select: { registrations: true } },
    },
  });

  if (!event) {
    notFound();
  }

  const totalRegistrations = event._count.registrations;
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
            <ImportCSVButton eventId={id} />
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

      
        </div>

        {/* Registrations Table (searchable + paginated, client-side) */}
        <EventRegistrationsTable eventId={id} />

      </div>
    </div>
  );
}