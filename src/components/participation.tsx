import Link from "next/link";
import { Check, Clock, LogIn, UserPlus } from "lucide-react";
import { ConfirmAction, QuickAction } from "./confirm";
import { cancelRegistrationAction, joinClubAction, leaveClubAction, registerEventAction } from "@/app/actions/student";
import type { RegState } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Viewer = { role: string } | null;

/** Register / registered / closed button for an event, matching the viewer's state. */
export function EventRegisterButton({
  eventId,
  state,
  registered,
  viewer,
  size = "sm",
  allowCancel = false,
  membersOnlyBlocked = false,
}: {
  eventId: string;
  state: RegState;
  registered: boolean;
  viewer: Viewer;
  size?: "sm" | "lg";
  allowCancel?: boolean;
  membersOnlyBlocked?: boolean;
}) {
  const btn = cn("btn", size === "sm" ? "btn-sm" : "btn-lg w-full");
  if (registered) {
    return (
      <div className={cn("flex items-center gap-2", size === "lg" && "flex-col")}>
        <span className={cn(btn, "cursor-default bg-brand-50 text-brand-700 ring-1 ring-brand-200")}>
          <Check className="size-4" /> Registered
        </span>
        {allowCancel && (state === "open" || state === "closed" || state === "full") && (
          <ConfirmAction
            action={cancelRegistrationAction}
            fields={{ eventId }}
            label="Cancel registration"
            className="text-sm font-medium text-red-600 hover:underline"
            title="Cancel registration?"
            message="You will lose your seat. If registration is still open you can register again later."
            confirmLabel="Cancel registration"
          />
        )}
      </div>
    );
  }
  const closedLabel: Partial<Record<RegState, string>> = {
    full: "Event full",
    closed: "Registration closed",
    cancelled: "Cancelled",
    ended: "Event ended",
    draft: "Not published",
  };
  if (state !== "open") return <span className={cn(btn, "cursor-not-allowed bg-slate-100 text-slate-500")}>{closedLabel[state]}</span>;
  if (!viewer)
    return (
      <Link href={`/login?next=/events/${eventId}`} className={cn(btn, "btn-primary")}>
        <LogIn className="size-4" /> Sign in to register
      </Link>
    );
  if (viewer.role === "ADMIN") return <span className={cn(btn, "bg-slate-100 text-slate-500")}>Open for students</span>;
  if (membersOnlyBlocked) return <span className={cn(btn, "bg-gold-50 text-gold-700 ring-1 ring-gold-200")}>Members only</span>;
  return (
    <QuickAction action={registerEventAction} fields={{ eventId }} className={cn(btn, "btn-primary")}>
      Register now
    </QuickAction>
  );
}

/** Join / pending / member button for a club. */
export function JoinClubButton({
  clubId,
  clubName,
  status,
  viewer,
  isRep,
  approvalRequired,
  nextPath = "/clubs",
}: {
  nextPath?: string;
  clubId: string;
  clubName: string;
  status?: string;
  viewer: Viewer;
  isRep?: boolean;
  approvalRequired: boolean;
}) {
  if (!viewer)
    return (
      <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="btn btn-gold btn-lg">
        <LogIn className="size-4" /> Sign in to join
      </Link>
    );
  if (viewer.role === "ADMIN") return null;
  if (isRep) return <span className="btn btn-lg cursor-default bg-white/90 text-brand-700">You manage this club</span>;
  if (status === "APPROVED")
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="btn btn-lg cursor-default bg-white/90 text-brand-700">
          <Check className="size-4" /> Member
        </span>
        <ConfirmAction
          action={leaveClubAction}
          fields={{ clubId }}
          label="Leave club"
          className="text-sm font-medium text-white/80 underline-offset-2 hover:underline"
          title={`Leave ${clubName}?`}
          message="You will stop receiving this club's announcements and lose access to members-only events."
          confirmLabel="Leave club"
        />
      </div>
    );
  if (status === "PENDING")
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="btn btn-lg cursor-default bg-gold-100 text-gold-700">
          <Clock className="size-4" /> Request pending
        </span>
        <QuickAction action={leaveClubAction} fields={{ clubId }} className="text-sm font-medium text-white/80 hover:underline">
          Withdraw
        </QuickAction>
      </div>
    );
  return (
    <QuickAction action={joinClubAction} fields={{ clubId }} className="btn btn-gold btn-lg">
      <UserPlus className="size-4" /> {status === "REJECTED" ? "Request again" : approvalRequired ? "Request to join" : "Join club"}
    </QuickAction>
  );
}
