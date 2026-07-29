import EventRegistrationForm from "@/components/client/eventRegistrationForm";
import { prisma } from "@/lib/prisma";
import { AlertCircle, ArrowLeft  } from "lucide-react";
import Link from "next/link";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const eventId = resolvedParams.id;

  if (!eventId) {
    return <EventNotFoundState message="Event ID မတွေ့ရှိပါ သို့မဟုတ် မှားယွင်းနေပါသည်။" />;
  }

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      isActive: true,
    },
  });

  if (!event) {
    return <EventNotFoundState message="ဤ Event ကို ရှာမတွေ့ပါ သို့မဟုတ် စာရင်းလက်ခံခြင်း ပိတ်ထားပါသည်။" />;
  }

  return <EventRegistrationForm event={event} />;
}

// Event Not Found State UI Component
function EventNotFoundState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-xl">
        <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Event ကို ရှာမတွေ့ပါ</h3>
        <p className="text-sm text-zinc-400 mb-6">{message}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ပင်မစာမျက်နှာသို့ ပြန်သွားမည်</span>
        </Link>
      </div>
    </div>
  );
}