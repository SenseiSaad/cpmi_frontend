"use client";

import { AnimatePresence, motion } from "motion/react";
import { Bell, CornerDownLeft, LogOut, Menu as MenuIcon, Search, ShieldCheck, UserCog } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Menu, type MenuItem } from "@/components/ui/menu";
import { useNotifications } from "@/lib/api/hooks";
import { ROLE_LABEL } from "@/lib/api/fixtures";
import { useSession } from "@/lib/auth/session";
import { cn, relativeDays } from "@/lib/utils";

import { PORTALS, searchableRoutes, type Portal } from "./nav";

function GlobalSearch({ portal }: { portal: Portal }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const routes = useMemo(() => searchableRoutes(portal), [portal]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (q ? routes.filter((r) => `${r.group ?? ""} ${r.label}`.toLowerCase().includes(q)) : routes).slice(0, 6);
  }, [query, routes]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    input.current?.blur();
    router.push(href);
  }

  return (
    <div className="relative hidden w-full max-w-md md:block">
      <label htmlFor={`${listId}-in`} className="sr-only">
        Search pages
      </label>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
      <input
        id={`${listId}-in`}
        ref={input}
        value={query}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Jump to a page…"
        onChange={(e) => {
          setQuery(e.target.value);
          setCursor(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setCursor((c) => (c + 1) % Math.max(results.length, 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setCursor((c) => (c - 1 + results.length) % Math.max(results.length, 1));
          } else if (e.key === "Enter" && results[cursor]) {
            go(results[cursor]!.href);
          } else if (e.key === "Escape") {
            setOpen(false);
            input.current?.blur();
          }
        }}
        className="h-11 w-full rounded-full bg-white pl-11 pr-16 text-sm text-ink-900 shadow-card ring-1 ring-navy-900/[0.05] placeholder:text-ink-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
      />
      <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md bg-navy-900/[0.07] px-1.5 py-0.5 text-[11px] font-semibold text-ink-600 lg:block">Ctrl K</kbd>
      <AnimatePresence>
        {open ? (
          <motion.ul
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute inset-x-0 top-full z-40 mt-2 rounded-2xl bg-white p-1.5 shadow-lift ring-1 ring-line"
          >
            {results.length === 0 ? <li className="px-3 py-3 text-sm text-ink-600">No matching pages</li> : null}
            {results.map((r, i) => (
              <li key={r.href} role="option" aria-selected={i === cursor}>
                <button type="button" onMouseEnter={() => setCursor(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => go(r.href)} className={cn("flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium", i === cursor ? "bg-canvas-soft text-ink-900" : "text-ink-700")}>
                  <span className="flex-1">
                    {r.group ? <span className="text-ink-500">{r.group} / </span> : null}
                    {r.label}
                  </span>
                  {i === cursor ? <CornerDownLeft className="size-3.5 text-ink-500" aria-hidden /> : null}
                </button>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Notifications() {
  const { data } = useNotifications();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const unread = data?.filter((n) => n.unread).length ?? 0;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="dialog" aria-expanded={open} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative grid size-11 place-items-center rounded-full bg-white text-ink-700 shadow-card ring-1 ring-navy-900/[0.05] transition hover:text-ink-900">
        <Bell className="size-5" aria-hidden />
        {unread > 0 ? <span className="absolute right-2.5 top-2.5 size-2.5 rounded-full bg-brand-500 ring-2 ring-white" /> : null}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div role="dialog" aria-label="Notifications" initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }} style={{ transformOrigin: "top right" }} className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-3xl bg-white p-2 shadow-lift ring-1 ring-line">
            <p className="px-3 py-2 text-sm font-bold text-ink-900">Notifications</p>
            <ul>
              {(data ?? []).map((n) => (
                <li key={n.id} className="flex gap-3 rounded-2xl px-3 py-3 hover:bg-canvas-soft">
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.unread ? "bg-brand-600" : "bg-ink-300")} aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900">
                      {n.title}
                      {n.unread ? <span className="sr-only"> (unread)</span> : null}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-600">{n.body}</p>
                    <p className="mt-1 text-xs text-ink-500">{relativeDays(n.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function UserMenu({ portal }: { portal: Portal }) {
  const router = useRouter();
  const { user, ready, signOut } = useSession();
  if (!ready || !user) return <div className="skeleton size-11 rounded-full" aria-hidden />;

  const items: MenuItem[] = [
    { label: "Profile & security", icon: UserCog, onSelect: () => router.push(PORTALS[portal].settings) },
    {
      label: "Sign out",
      icon: LogOut,
      tone: "danger" as const,
      onSelect: () => {
        void signOut().then(() => router.push("/login"));
      },
    },
  ];

  return (
    <Menu
      label={`Account menu for ${user.firstName} ${user.lastName}`}
      items={items}
      triggerClassName="!size-auto !rounded-full !p-0 hover:!bg-transparent"
      trigger={
        <span className="flex items-center gap-2.5 rounded-full bg-white py-1 pl-1 pr-4 shadow-card ring-1 ring-navy-900/[0.05]">
          <Avatar first={user.firstName} last={user.lastName} size="sm" online />
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-bold leading-tight text-ink-900">
              {user.firstName} {user.lastName}
            </span>
            <span className="block text-xs leading-tight text-ink-600">{ROLE_LABEL[user.role]}</span>
          </span>
        </span>
      }
    />
  );
}

export function Topbar({ portal, onOpenMenu }: { portal: Portal; onOpenMenu: () => void }) {
  return (
    <div className="sticky top-0 z-30 -mx-4 mb-2 flex items-center gap-3 bg-canvas/80 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 no-print">
      <button type="button" onClick={onOpenMenu} className="grid size-11 place-items-center rounded-full bg-white text-ink-900 shadow-card ring-1 ring-navy-900/[0.05] lg:hidden" aria-label="Open navigation menu">
        <MenuIcon className="size-5" aria-hidden />
      </button>
      <Link href={PORTALS[portal].home} className="flex items-center gap-2 lg:hidden" aria-label="Home">
        <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
      </Link>
      <GlobalSearch portal={portal} />
      <div className="ml-auto flex items-center gap-3">
        <Notifications />
        <UserMenu portal={portal} />
      </div>
    </div>
  );
}
