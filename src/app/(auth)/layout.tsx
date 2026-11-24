import Link from "next/link";
import { Logo } from "@/components/visuals";
import { CampusScene } from "@/components/campus-scene";
import { ClubCardMini, NextEventCard, RegisteredCard, sceneData } from "@/components/scene-cards";
import { getSettings } from "@/lib/settings";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [s, data] = await Promise.all([getSettings(), sceneData()]);
  return (
    <div className="relative min-h-dvh bg-[#E4F0E7] lg:h-dvh lg:overflow-hidden">
      {/* Illustrated scene: full panel on desktop, header strip on phones */}
      <div className="relative h-[34vh] min-h-56 overflow-hidden bg-gradient-to-br from-[#EEF7F0] via-[#E1EFE5] to-[#CFE5D6] lg:absolute lg:inset-0 lg:h-auto">
        <div className="absolute inset-0 lg:right-[min(46vw,600px)]">
          <CampusScene className="absolute inset-x-0 bottom-0 h-full w-full overflow-visible lg:inset-y-0" />
          <NextEventCard data={data} className="absolute top-[13%] right-[6%] hidden animate-float xl:block" />
          <RegisteredCard data={data} className="absolute top-[46%] right-[3%] hidden animate-float [animation-delay:1.5s] xl:flex" />
          <ClubCardMini data={data} className="absolute bottom-[6%] left-[5%] hidden animate-float [animation-delay:3s] xl:block" />
        </div>
        <Link href="/" aria-label={`${s.siteName} home`} className="absolute top-4 left-4 rounded-2xl bg-white/80 px-3 py-2 backdrop-blur lg:top-7 lg:left-8">
          <Logo name={s.siteName} />
        </Link>
      </div>

      {/* Form card */}
      <div className="relative z-10 -mt-8 lg:absolute lg:inset-y-5 lg:right-5 lg:mt-0 lg:w-[min(46vw,580px)]">
        <div className="auth flex min-h-[calc(66vh+2rem)] flex-col rounded-t-[28px] bg-white px-5 pt-8 pb-6 sm:px-10 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:rounded-[28px] lg:shadow-[0_30px_80px_-30px_rgb(11_52_40/0.35)]">
          <div className="mx-auto hidden lg:block"><Logo name={s.siteName} /></div>
          <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-4 lg:py-10">{children}</div>
          <p className="text-center text-xs text-slate-400">© {new Date().getFullYear()} {s.siteName} · {s.universityName}</p>
        </div>
      </div>
    </div>
  );
}
