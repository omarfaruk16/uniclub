import type { Metadata } from "next";
import { requireRepClub } from "@/lib/rep";
import { PageHeader } from "@/components/ui";
import { EventForm } from "@/components/event-form";
import { toInputParts } from "@/lib/utils";

export const metadata: Metadata = { title: "Create Event" };

export default async function NewEventPage() {
  const { club } = await requireRepClub();
  const today = toInputParts(new Date()).date;
  return (
    <>
      <PageHeader title="Create Event" description={`Publish a new event for ${club.name}.`} />
      {club.status !== "APPROVED" ? (
        <div className="rounded-2xl border border-gold-200 bg-gold-50 p-5 text-sm text-gold-700">Your club must be approved before it can create events.</div>
      ) : (
        <EventForm today={today} />
      )}
    </>
  );
}
