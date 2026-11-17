import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRepClub } from "@/lib/rep";
import { PageHeader, StatusBadge } from "@/components/ui";
import { EventForm } from "@/components/event-form";
import { eventPhase, toInputParts } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit Event" };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { club } = await requireRepClub();
  const event = await db.event.findUnique({ where: { id: (await params).id } });
  if (!event || event.clubId !== club.id) notFound();
  const start = toInputParts(event.startAt);
  const end = toInputParts(event.endAt);
  const deadline = toInputParts(event.registrationDeadline);
  return (
    <>
      <PageHeader title="Edit Event" description={<span className="inline-flex items-center gap-2">{event.title} <StatusBadge status={eventPhase(event)} /></span>} />
      <EventForm
        today={toInputParts(new Date()).date}
        defaults={{
          id: event.id,
          title: event.title,
          category: event.category,
          description: event.description,
          venue: event.venue,
          date: start.date,
          startTime: start.time,
          endTime: end.time,
          deadlineDate: deadline.date,
          deadlineTime: deadline.time,
          capacity: event.capacity,
          membersOnly: event.membersOnly,
          image: event.image,
          status: event.status,
        }}
      />
    </>
  );
}
