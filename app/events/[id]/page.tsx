import EventRegistrationForm from "@/components/client/eventRegistrationForm";
import { prisma } from "@/lib/prisma";
import { AlertCircle, ArrowLeft, HandCoins, Building2 } from "lucide-react";
import Link from "next/link";

export const revalidate = 60;

export async function generateStaticParams() {
  const events = await prisma.event.findMany({
    where: { isActive: true },
    select: { id: true },
  });
  return events.map((event) => ({ id: event.id }));
}

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

  // Sponsors များကို ဆွဲယူခြင်း
  const sponsors = await prisma.eventSponsor.findMany({
    where: { eventId },
    include: { sponsor: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EventRegistrationForm event={event} />
      {sponsors.length > 0 && (
        <footer className="pb-10">
          <div className="max-w-2xl mx-auto px-4">
            <div className="text-center mb-5">
              <HandCoins className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Event Sponsors
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {sponsors.map(({ sponsor, amount }) => (
                <SponsorCard
                  key={sponsor.id}
                  name={sponsor.name}
                  website={sponsor.website}
                  description={sponsor.description}
                  amount={amount ? Number(amount) : null}
                />
              ))}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

function SponsorCard({
  name,
  website,
  description,
  amount,
}: {
  name: string;
  website: string | null;
  description: string | null;
  amount: number | null;
}) {
  return (
    <a
      href={website || undefined}
      target="_blank"
      rel="noreferrer"
      className="group p-5 rounded-2xl bg-card border border-border hover:border-amber-500/40 transition text-center"
    >
      <div className="p-3 rounded-full bg-muted text-muted-foreground group-hover:text-amber-400 inline-flex items-center justify-center mb-3">
        <Building2 className="w-5 h-5" />
      </div>
      <h3 className="font-semibold text-foreground text-sm mb-1">{name}</h3>
      {amount !== null && (
        <p className="text-xs text-muted-foreground">
          {Number(amount).toLocaleString()} ကျပ်
        </p>
      )}
      {description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{description}</p>
      )}
    </a>
  );
}

// Event Not Found State UI Component
function EventNotFoundState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center shadow-xl">
        <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">Event ကို ရှာမတွေ့ပါ</h3>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-accent text-foreground rounded-lg text-sm font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ပင်မစာမျက်နှာသို့ ပြန်သွားမည်</span>
        </Link>
      </div>
    </div>
  );
}