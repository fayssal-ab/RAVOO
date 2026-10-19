import type { Metadata } from "next";
import SiteLayout from "./(site)/layout";
import { NotFoundBody } from "@/components/shell/NotFoundBody";

export const metadata: Metadata = { title: "Page not found" };

// Unknown URLs land here (outside the (site) group), so wrap the 404 in the
// same shell: navbar, backdrop, footer.
export default function NotFound() {
  return (
    <SiteLayout>
      <NotFoundBody />
    </SiteLayout>
  );
}
