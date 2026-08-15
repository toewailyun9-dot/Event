import { prisma } from "@/lib/prisma";
import EventRegistrationForm from "@/components/client/eventRegistrationForm";
import WelcomeScreen from "@/components/client/welcomeScreen";

export const revalidate = 60;

export default async function Page() {
  const event = await prisma.event.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      eventDate: true,
      location: true,
      telegramLink: true,
      viberLink: true,
    },
  });

  return event ? <EventRegistrationForm event={event} /> : <WelcomeScreen />;
}
