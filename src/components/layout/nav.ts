import {
  Award,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardCheck,
  CreditCard,
  LayoutDashboard,
  Library,
  Receipt,
  Settings,
  Ticket,
  UserCog,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

export type Portal = "learner" | "agency" | "admin";

export interface NavChild {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  children?: NavChild[];
}

export interface PortalConfig {
  name: string;
  home: string;
  settings: string;
  nav: NavItem[];
}

export const PORTALS: Record<Portal, PortalConfig> = {
  learner: {
    name: "Learner",
    home: "/learner",
    settings: "/learner/profile",
    nav: [
      { label: "Dashboard", href: "/learner", icon: LayoutDashboard },
      { label: "My courses", href: "/learner/courses", icon: BookOpen },
      { label: "Assessments", href: "/learner/assessments", icon: ClipboardCheck },
      { label: "Certificates", href: "/learner/certificates", icon: Award },
      { label: "Profile", href: "/learner/profile", icon: UserCog },
    ],
  },
  agency: {
    name: "Agency admin",
    home: "/agency",
    settings: "/agency/settings",
    nav: [
      { label: "Overview", href: "/agency", icon: LayoutDashboard },
      {
        label: "Team",
        href: "/agency/members",
        icon: Users,
        children: [
          { label: "Members", href: "/agency/members" },
          { label: "Invitations", href: "/agency/invitations" },
        ],
      },
      { label: "Seats", href: "/agency/seats", icon: Ticket },
      {
        label: "Billing",
        href: "/agency/store",
        icon: CreditCard,
        children: [
          { label: "Buy seats", href: "/agency/store" },
          { label: "Orders", href: "/agency/orders" },
        ],
      },
      { label: "Reports", href: "/agency/reports", icon: BarChart3 },
      { label: "Settings", href: "/agency/settings", icon: Settings },
    ],
  },
  admin: {
    name: "Platform",
    home: "/admin",
    settings: "/admin/settings",
    nav: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      { label: "Agencies", href: "/admin/agencies", icon: Building2 },
      { label: "Catalog & pricing", href: "/admin/courses", icon: Library },
      { label: "Orders", href: "/admin/orders", icon: Receipt },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
};

export function isActive(pathname: string, href: string, exactRoots: string[]): boolean {
  if (exactRoots.includes(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Flat list for the global search. */
export function searchableRoutes(portal: Portal): { label: string; href: string; group?: string }[] {
  const out: { label: string; href: string; group?: string }[] = [];
  for (const item of PORTALS[portal].nav) {
    if (item.children) item.children.forEach((c) => out.push({ label: c.label, href: c.href, group: item.label }));
    else out.push({ label: item.label, href: item.href });
  }
  return out;
}
