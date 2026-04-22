"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Briefcase,
  DollarSign, TrendingUp, LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Candidates", href: "/candidates", icon: Users },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Cost analysis", href: "/cost", icon: DollarSign },
  { label: "Trends", href: "/trends", icon: TrendingUp },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("smarthr_token");
    localStorage.removeItem("smarthr_company");
    router.push("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        Smart<span>HR</span>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link-item ${active ? "active" : ""}`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button onClick={handleLogout} className="nav-link-item danger">
        <LogOut size={16} />
        Sign out
      </button>
    </aside>
  );
}