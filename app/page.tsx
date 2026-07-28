import EventRegistrationForm from "@/components/client/eventRegistrationForm";
import { prisma } from "@/lib/prisma";


export const revalidate = 0; // Data အမြဲတမ်း Live Fresh ဖြစ်နေစေရန်

export default async function Page() {
  // နောက်ဆုံး Active ဖြစ်သော Event ကို ရှာဖွေခြင်း
  const activeEvent = await prisma.event.findFirst({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "desc", // နောက်ဆုံး ဖန်တီးခဲ့သော Active Event
    },
  });

  return <EventRegistrationForm event={activeEvent} />;
}