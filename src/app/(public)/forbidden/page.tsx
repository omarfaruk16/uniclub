import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";

export default async function ForbiddenPage() {
  const user = await getCurrentUser();
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-gold-50 text-gold-600"><ShieldAlert className="size-8" /></div>
      <h1 className="text-3xl font-bold">You don&apos;t have access to that page</h1>
      <p className="mt-2 max-w-md text-slate-500">This area is for a different role. If you think this is a mistake, contact the administrator.</p>
      <Link href={user ? (ROLE_HOME[user.role] ?? "/") : "/"} className="btn btn-primary mt-6">Go to my dashboard</Link>
    </div>
  );
}
