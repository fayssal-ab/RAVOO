import { FloatingDecor } from "@/components/decor/FloatingDecor";
import { Backdrop } from "@/components/shell/Backdrop";
import { Footer } from "@/components/shell/Footer";
import { TopBar } from "@/components/shell/TopBar";
import { getViewer } from "@/lib/account";
import { getLiveStatus } from "@/lib/stream";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [viewer, live] = await Promise.all([getViewer(), getLiveStatus()]);
  return (
    <>
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
    </>
  );
}
