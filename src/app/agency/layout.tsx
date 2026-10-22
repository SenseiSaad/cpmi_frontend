import { PortalGuard } from "@/components/auth/portal-guard";
import { AppShell } from "@/components/layout/app-shell";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuard roles={["agency_admin"]}>
      <AppShell portal="agency">{children}</AppShell>
    </PortalGuard>
  );
}
