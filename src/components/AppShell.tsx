"use client";

import {
  BarChart3,
  Boxes,
  FilePlus2,
  FileText,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  PackagePlus,
  Settings,
  UsersRound,
  WalletCards
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { demoSession } from "@/lib/session";

const navItems = [
  { href: "/", key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoice", key: "newInvoice", label: "New Invoice", icon: FilePlus2 },
  { href: "/reports", key: "reports", label: "Reports", icon: BarChart3 },
  { href: "/customers", key: "customers", label: "Customers", icon: UsersRound },
  { href: "/inventory", key: "inventory", label: "Inventory", icon: Boxes },
  { href: "/ledger", key: "ledger", label: "Ledger", icon: WalletCards },
  { href: "/purchases", key: "purchases", label: "Purchases", icon: PackagePlus },
  { href: "/invoices", key: "invoices", label: "Invoices", icon: FileText },
  { href: "/settings", key: "settings", label: "Settings", icon: Settings }
] as const;

type AppShellProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
};

export function AppShell({ action, children, eyebrow, subtitle, title }: AppShellProps) {
  const pathname = usePathname();
  const company = demoSession.company;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <main className={sidebarCollapsed ? "app-shell sidebar-collapsed" : "app-shell"}>
      <aside className="sidebar">
        <Link className="brand" href="/">
          <div className="brand-mark">SD</div>
          <div className="brand-text">
            <strong>SeedDesk</strong>
            <span>Company workspace</span>
          </div>
        </Link>

        <nav className="nav-list" aria-label="Primary">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <Link className={active ? "nav-item active" : "nav-item"} href={href} key={href}>
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <button
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed((current) => !current)}
              type="button"
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <div>
              <p>{eyebrow}</p>
              <h1>{title}</h1>
            </div>
          </div>
          {action ? <div className="topbar-actions">{action}</div> : null}
        </header>

        {subtitle ? (
          <section className="hero-band">
            <div>
              <p>{company.name}</p>
              <h2>{subtitle}</h2>
            </div>
          </section>
        ) : null}

        {children}
      </section>
    </main>
  );
}
