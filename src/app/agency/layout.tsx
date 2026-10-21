import type { ReactNode } from "react";
import { RequireAuth } from "@/features/auth/guards";

export default function Layout({ children }: { children: ReactNode }) {
  return <RequireAuth roles={["agency_admin"]}>{children}</RequireAuth>;
}
