"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  Users,
  BarChart3,
  DollarSign,
  Megaphone,
  MessageSquare,
  Bell,
  Settings,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/creator/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/creator/library", label: "Library", icon: Library },
  { href: "/creator/audience", label: "Audience", icon: Users },
  { href: "/creator/insights", label: "Insights", icon: BarChart3 },
  { href: "/creator/payouts", label: "Payouts", icon: DollarSign },
  { href: "/creator/promotions", label: "Promotions", icon: Megaphone },
  { href: "/chats", label: "Chats", icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function CreatorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/creator/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">S</span>
            </div>
            <span className="text-lg font-semibold">SuiPatreon</span>
          </Link>
        </div>

        {/* Create Button */}
        <div className="p-4">
          <Button className="w-full" asChild>
            <Link href="/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create
            </Link>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Creator Info */}
        <div className="border-t border-border p-4">
          <Link
            href="/creator/profile"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-semibold text-white">
              T
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">tomkapa</p>
              <p className="truncate text-xs text-muted-foreground">Creator</p>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
}
