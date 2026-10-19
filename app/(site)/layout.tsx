import { FloatingDecor } from "@/components/decor/FloatingDecor";
import { ZzzGame } from "@/components/game/ZzzGame";
import { CodeEgg } from "@/components/fx/CodeEgg";
import { Insomnia } from "@/components/fx/Insomnia";
import { PawTrail } from "@/components/fx/PawTrail";
import { Backdrop } from "@/components/shell/Backdrop";
import { CookieBanner } from "@/components/shell/CookieBanner";
import { Footer } from "@/components/shell/Footer";
import { Preloader } from "@/components/shell/Preloader";
import { TopBar } from "@/components/shell/TopBar";
import { getViewer } from "@/lib/account";
import { getLiveStatus } from "@/lib/stream";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [viewer, live] = await Promise.all([getViewer(), getLiveStatus()]);
  return (
    <>
      <Preloader />
      <Backdrop />
      <TopBar
        live={live.live}
        viewer={viewer && { name: viewer.display_name, avatar: viewer.avatar, points: viewer.points, level: viewer.level }}
      />
      <div className="relative isolate overflow-x-clip">
        <FloatingDecor />
        <main className="pt-[calc(var(--nav-h)+1.5rem)]">{children}</main>
        <Footer />
      </div>
      <ZzzGame />
      <PawTrail />
      <Insomnia />
      <CodeEgg />
      <CookieBanner />
    </>
  );
}
