"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/states";
import { ROLE_LABEL } from "@/lib/api/fixtures";
import { useSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

import { Logo } from "./logo";
import { PORTALS, isActive, type NavItem, type Portal } from "./nav";

function NavLink({ item, pathname, roots, onNavigate, pillId }: { item: NavItem; pathname: string; roots: string[]; onNavigate?: () => void; pillId: string }) {
  const hasChildren = !!item.children;
  const childActive = item.children?.some((c) => isActive(pathname, c.href, roots)) ?? false;
  const active = hasChildren ? childActive : isActive(pathname, item.href, roots);
  const [manual, setManual] = useState<boolean | null>(null);
  const open = manual ?? childActive;
  const Icon = item.icon;

  const base = "group relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-colors";

  if (hasChildren) {
    return (
      <div>
        <button type="button" onClick={() => setManual(!open)} aria-expanded={open} className={cn(base, "text-navy-100 hover:bg-white/[0.06]", active && "text-white")}>
          {active ? <motion.span layoutId={pillId} className="absolute inset-0 rounded-2xl bg-white/[0.09] ring-1 ring-white/10" transition={{ type: "spring", stiffness: 420, damping: 36 }} /> : null}
          <Icon className={cn("relative size-5 shrink-0", active && "text-brand-400")} />
          <span className="relative">{item.label}</span>
          <ChevronDown className={cn("relative ml-auto size-4 transition-transform duration-300", open && "rotate-180")} aria-hidden />
        </button>
        <AnimatePresence initial={false}>
          {open ? (
            <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
              <div className="my-1 ml-[1.65rem] border-l border-white/10 pl-4">
                {item.children!.map((c) => {
                  const on = isActive(pathname, c.href, roots);
                  return (
                    <li key={c.href}>
                      <Link href={c.href} onClick={onNavigate} aria-current={on ? "page" : undefined} className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors", on ? "text-brand-400" : "text-navy-300 hover:text-white")}>
                        {c.label}
                      </Link>
                    </li>
                  );
                })}
              </div>
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn(base, active ? "text-white" : "text-navy-100 hover:bg-white/[0.06]")}>
      {active ? <motion.span layoutId={pillId} className="absolute inset-0 rounded-2xl bg-white/[0.09] ring-1 ring-white/10" transition={{ type: "spring", stiffness: 420, damping: 36 }} /> : null}
      <Icon className={cn("relative size-5 shrink-0", active && "text-brand-400")} />
      <span className="relative">{item.label}</span>
    </Link>
  );
}

export function SidebarContent({ portal, onNavigate }: { portal: Portal; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, signOut } = useSession();
  const config = PORTALS[portal];
  const roots = [config.home];

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-6">
        <Logo href={config.home} />
      </div>
      <p className="px-6 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-navy-300/70">{config.name}</p>
      <nav aria-label={`${config.name} navigation`} className="thin-scroll flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {config.nav.map((item) => (
          <NavLink key={item.label} item={item} pathname={pathname} roots={roots} onNavigate={onNavigate} pillId={`pill-${portal}`} />
        ))}
      </nav>
      <div className="p-3">
        <div className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
          {ready && user ? (
            <div className="flex items-center gap-3">
              <Avatar first={user.firstName} last={user.lastName} size="md" online />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-navy-300">{ROLE_LABEL[user.role]}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void signOut().then(() => router.push("/login"));
                }}
                className="grid size-9 place-items-center rounded-xl text-navy-300 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Sign out"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-full !bg-white/10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24 !bg-white/10" />
                <Skeleton className="h-3 w-16 !bg-white/10" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
