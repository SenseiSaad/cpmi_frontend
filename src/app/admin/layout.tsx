import type { ReactNode } from "react";
import { RequireAuth } from "@/features/auth/guards";

export default function Layout({ children }: { children: ReactNode }) {
  return <RequireAuth roles={["super_admin", "training_manager"]}>{children}</RequireAuth>;
}
