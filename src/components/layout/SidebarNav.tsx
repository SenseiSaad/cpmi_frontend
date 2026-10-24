"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  Award,
  User,
  LayoutDashboard,
  Building2,
  BarChart3,
  Settings,
  Users,
} from "lucide-react";

// 1. Learner Sidebar Navigation (Screen 3 Reference)
const learnerNavItems = [
  { href: "/learner", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/learner/courses", icon: BookOpen, label: "My Courses" },
  { href: "/learner/assessments", icon: ClipboardList, label: "Assessments" },
  { href: "/learner/certificates", icon: Award, label: "Certificates" },
  { href: "/learner/profile", icon: User, label: "Profile" },
];

export function LearnerSidebar() {
  const pathname = usePathname();
  return (
    <nav className="px-3 space-y-1.5">
      {learnerNavItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/learner" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 focus:outline-none ${
              isActive
                ? "bg-secondary-500 text-primary-950 shadow-sm"
                : "text-white/75 hover:text-white hover:bg-white/5"
            }`}
          >
            <item.icon size={16} className={isActive ? "text-primary-950" : "text-secondary-400"} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// 2. Agency Admin Sidebar Navigation (Screen 8 Reference)
const agencyNavItems = [
  { href: "/agency", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/agency/members", icon: Users, label: "Team Management" },
  { href: "/agency/reports", icon: BarChart3, label: "Compliance Reports" },
  { href: "/agency/settings", icon: Settings, label: "Seats & Invoicing" },
];

export function AgencySidebar() {
  const pathname = usePathname();
  return (
    <nav className="px-3 space-y-1.5">
      {agencyNavItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/agency" && pathname.startsWith(item.href)) ||
          (item.href === "/agency" && pathname === "/agency/members");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 focus:outline-none ${
              isActive
                ? "bg-secondary-500 text-primary-950 shadow-sm"
                : "text-white/75 hover:text-white hover:bg-white/5"
            }`}
          >
            <item.icon size={16} className={isActive ? "text-primary-950" : "text-secondary-400"} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// 3. Super Admin Sidebar Navigation (Screen 7 Reference)
const adminNavItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/agencies", icon: Building2, label: "Agencies" },
  { href: "/admin/courses", icon: BookOpen, label: "Courses & Content" },
  { href: "/admin/reports", icon: BarChart3, label: "Reports & Analytics" },
  { href: "/admin/settings", icon: Settings, label: "Settings & Pricing" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav className="px-3 space-y-1.5">
      {adminNavItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 focus:outline-none ${
              isActive
                ? "bg-secondary-500 text-primary-950 shadow-sm"
                : "text-white/75 hover:text-white hover:bg-white/5"
            }`}
          >
            <item.icon size={16} className={isActive ? "text-primary-950" : "text-secondary-400"} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
