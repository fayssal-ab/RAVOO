import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false } };

// OBS browser sources: transparent page, no site chrome.
export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{"html,body{background:transparent!important;overflow:hidden}"}</style>
      {children}
    </>
  );
}
