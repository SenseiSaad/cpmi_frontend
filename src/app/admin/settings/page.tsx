"use client";

import { Database, Globe2, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { env } from "@/config/env";
import { useHealth } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/session";
import { formatNumber } from "@/lib/utils";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-3 text-sm last:border-0">
      <span className="text-ink-600">{label}</span>
      <span className="font-semibold text-ink-900">{value}</span>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { user, signOut } = useSession();
  const health = useHealth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Settings"
        subtitle="Your account, environment and service health. Platform policy is configured on the backend."
        actions={<Button variant="secondary" icon={<LogOut className="size-4" aria-hidden />} onClick={() => void handleSignOut()}>Sign out</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Account" description="Signed-in platform operator." />
          <Row label="Name" value={<span className="inline-flex items-center gap-2"><UserRound className="size-4 text-ink-500" aria-hidden />{user ? `${user.firstName} ${user.lastName}` : "—"}</span>} />
          <Row label="Email" value={user?.email ?? "—"} />
          <Row label="Role" value={<Badge tone="navy">{user?.role.replace(/_/g, " ") ?? "—"}</Badge>} />
          <Row label="User ID" value={<span className="font-mono text-xs">{user?.userPublicId ?? "—"}</span>} />
        </Panel>

        <Panel>
          <PanelHeader title="Environment" description="Build-time configuration of this deployment." />
          <Row label="API mode" value={<Badge tone={env.apiMode === "live" ? "ok" : "warn"} dot>{env.apiMode}</Badge>} />
          <Row label="API base" value={<span className="inline-flex items-center gap-1.5 font-mono text-xs"><Globe2 className="size-3.5 text-ink-500" aria-hidden />{env.apiBaseUrl || "same-origin proxy"}</span>} />
          <Row label="Environment" value={env.environment} />
          <Row
            label="Database"
            value={
              health.data ? (
                <Badge tone="ok" dot>Reachable</Badge>
              ) : health.isError ? (
                <Badge tone="bad" dot>Unavailable</Badge>
              ) : (
                <Badge tone="neutral">Checking…</Badge>
              )
            }
          />
        </Panel>
      </div>

      <Panel className="mt-6">
        <PanelHeader title="Service health" description="Live queue snapshot from the backend observability endpoint." action={<ShieldCheck className="size-5 text-ok" aria-hidden />} />
        {health.data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-canvas-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Audit queue</p>
              <p className="tnum mt-2 text-2xl font-extrabold text-ink-900">{formatNumber(health.data.auditQueue.pending)}</p>
              <p className="text-xs text-ink-600">pending</p>
            </div>
            <div className="rounded-2xl bg-canvas-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Webhooks</p>
              <p className="tnum mt-2 text-2xl font-extrabold text-ink-900">{formatNumber(health.data.webhooks.failed)}</p>
              <p className="text-xs text-ink-600">failed</p>
            </div>
            <div className="rounded-2xl bg-canvas-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Notifications</p>
              <p className="tnum mt-2 text-2xl font-extrabold text-ink-900">{formatNumber(health.data.email.pending)}</p>
              <p className="text-xs text-ink-600">queued</p>
            </div>
            <div className="rounded-2xl bg-canvas-soft p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-600"><Database className="size-3.5" aria-hidden /> Workers</p>
              <p className="tnum mt-2 text-2xl font-extrabold text-ink-900">{health.data.workers.filter((w) => w.ok).length}/{health.data.workers.length}</p>
              <p className="text-xs text-ink-600">healthy</p>
            </div>
          </div>
        ) : (
          <p className="py-6 text-sm text-ink-600">{health.isError ? "Could not reach the health endpoint." : "Loading…"}</p>
        )}
      </Panel>
    </>
  );
}
