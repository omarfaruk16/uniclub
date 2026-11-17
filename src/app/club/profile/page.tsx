import type { Metadata } from "next";
import Link from "next/link";
import { requireRepClub } from "@/lib/rep";
import { PageHeader } from "@/components/ui";
import { ClubForm } from "@/components/club-form";
import { updateClubProfileAction } from "@/app/actions/club";

export const metadata: Metadata = { title: "Club Profile" };

export default async function ClubProfilePage() {
  const { club } = await requireRepClub();
  return (
    <>
      <PageHeader
        title="Club Profile"
        description="This information appears on your club's public page."
        actions={<Link href={`/clubs/${club.slug}`} className="btn btn-outline">View public page</Link>}
      />
      <ClubForm action={updateClubProfileAction} defaults={club} />
    </>
  );
}
