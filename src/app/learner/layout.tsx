import { PortalGuard } from "@/components/auth/portal-guard";
import { AppShell } from "@/components/layout/app-shell";

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuard roles={["learner", "agency_admin", "super_admin", "training_manager"]}>
      <AppShell portal="learner">{children}</AppShell>
    </PortalGuard>
  );
}
