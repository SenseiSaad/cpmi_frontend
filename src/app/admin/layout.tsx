import { PortalGuard } from "@/components/auth/portal-guard";
import { AppShell } from "@/components/layout/app-shell";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuard roles={["super_admin", "training_manager"]}>
      <AppShell portal="admin">{children}</AppShell>
    </PortalGuard>
  );
}
