"use client";

import { Check, Search } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/field";
import { useDebounced, useMemberSearch } from "@/lib/api/lists";
import type { MemberRow } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * Search-as-you-type chooser for an active member of the agency. It asks the server for at most 8 matches per
 * pause in typing, so it stays fast for an agency with thousands of staff (a plain dropdown would load them all).
 */
export function MemberPicker({ value, onChange, excludeId, id }: { value: string; onChange: (member: MemberRow) => void; excludeId?: string | null | undefined; id?: string }) {
  const [text, setText] = useState("");
  const term = useDebounced(text, 300);
  const results = useMemberSearch(term.trim());
  const rows = (results.data ?? []).filter((m) => m.membershipId !== excludeId);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
        <Input id={id} data-autofocus type="search" autoComplete="off" className="pl-10" placeholder="Type a name or email" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <ul className="mt-2 max-h-56 space-y-1 overflow-auto" role="listbox" aria-label="Active members" data-lenis-prevent>
        {results.isPending ? <li className="px-3 py-2 text-sm text-ink-500">Searching…</li> : null}
        {results.isError ? <li className="px-3 py-2 text-sm text-bad">Could not search members.</li> : null}
        {!results.isPending && !results.isError && rows.length === 0 ? <li className="px-3 py-2 text-sm text-ink-600">{term ? "No active member matches." : "No active members yet. Invite people first."}</li> : null}
        {rows.map((m) => {
          const selected = m.membershipId === value;
          const name = `${m.user.firstName} ${m.user.lastName}`.trim();
          return (
            <li key={m.membershipId} role="option" aria-selected={selected}>
              <button type="button" onClick={() => onChange(m)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors", selected ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-canvas-soft")}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink-900">{name || m.user.email}</span>
                  <span className="block truncate font-mono text-xs text-ink-600">{m.user.email}</span>
                </span>
                {selected ? <Check className="size-4 shrink-0 text-brand-700" aria-hidden /> : null}
              </button>
            </li>
          );
        })}
      </ul>
      {!term ? <p className="mt-1 px-1 text-xs text-ink-500">Showing a few members. Type to find anyone.</p> : null}
    </div>
  );
}
