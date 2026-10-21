"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Activity, Bell, CreditCard, ScrollText, Tags } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/shared/QueryState";
import { platformApi, type QueueStat } from "@/features/platform/api";
import { AdminPage, btnDark, Panel, StatusPill } from "@/features/platform/ui";

function age(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86_400)}d`;
}

function mb(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

function QueueRow({ name, desc, icon: Icon, queue }: { name: string; desc: string; icon: typeof Activity; queue: QueueStat }) {
  return (
    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-primary-900">
          <Icon size={18} />
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-900">{name}</h3>
          <p className="text-[11px] text-gray-500">{desc}</p>
        </div>
      </div>
      <dl className="flex gap-5 text-xs">
        <div>
          <dt className="text-[10px] font-bold uppercase text-gray-400">Pending</dt>
          <dd className="font-black text-gray-900 tabular-nums">{queue.pending}</dd>
        </div>
        {queue.sending !== undefined && (
          <div>
            <dt className="text-[10px] font-bold uppercase text-gray-400">Sending</dt>
            <dd className="font-black text-gray-900 tabular-nums">{queue.sending}</dd>
          </div>
        )}
        {queue.failed !== undefined && (
          <div>
            <dt className="text-[10px] font-bold uppercase text-gray-400">Failed</dt>
            <dd className={`font-black tabular-nums ${queue.failed > 0 ? "text-red-700" : "text-gray-900"}`}>{queue.failed}</dd>
          </div>
        )}
        <div>
          <dt className="text-[10px] font-bold uppercase text-gray-400">Oldest</dt>
          <dd className="font-black text-gray-900 tabular-nums">{age(queue.oldestSeconds)}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function AdminSettingsPage() {
  const ops = useQuery({
    queryKey: ["platform", "observability"],
    queryFn: () => platformApi.observability(),
    refetchInterval: 30_000
  });

  return (
    <AdminPage title="Platform Operations" subtitle="Background queue health and process status">
      <div className="max-w-4xl space-y-6">
        <Panel
          title="Queues"
          description="Leading indicators: a growing backlog or an old oldest item means a worker is behind. Refreshes every 30 seconds."
          action={ops.data ? <StatusPill status={ops.data.status === "ok" ? "active" : ops.data.status} /> : undefined}
        >
          {ops.isPending ? (
            <LoadingState />
          ) : ops.isError ? (
            <ErrorState error={ops.error} onRetry={() => void ops.refetch()} />
          ) : (
            <div className="space-y-3">
              <QueueRow name="Audit outbox" desc="Events waiting to be appended to the hash-chained audit log" icon={ScrollText} queue={ops.data.queues.auditOutbox} />
              <QueueRow name="Notifications" desc="Transactional email waiting for delivery" icon={Bell} queue={ops.data.queues.notifications} />
              <QueueRow name="Stripe webhooks" desc="Payment events waiting to be processed or retried" icon={CreditCard} queue={ops.data.queues.stripeWebhooks} />
            </div>
          )}
        </Panel>

        {ops.data && (
          <Panel title="API process">
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              {[
                ["Uptime", age(ops.data.process.uptimeSeconds)],
                ["Node", ops.data.process.nodeVersion],
                ["RSS memory", mb(ops.data.process.memory.rssBytes)],
                ["Heap used", `${mb(ops.data.process.memory.heapUsedBytes)} / ${mb(ops.data.process.memory.heapTotalBytes)}`]
              ].map(([label, value]) => (
                <div key={label} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <dt className="text-[10px] font-bold uppercase text-gray-400">{label}</dt>
                  <dd className="mt-1 font-black text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        )}

        <Panel title="Pricing" description="Prices are set per product (annual or monthly) and take effect for new orders.">
          <Link href="/admin/products" className={btnDark}>
            <Tags size={14} className="text-secondary-400" /> Manage products & pricing
          </Link>
        </Panel>
      </div>
    </AdminPage>
  );
}
