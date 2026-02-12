"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  CalendarPlus,
  Hotel,
  Users,
  GripVertical,
  AlertTriangle,
  Sparkles,
  LogOut,
  ChevronRight,
  HelpCircle,
  Menu,
  X,
  Calendar,
  BarChart3,
  QrCode,
  Activity,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Overview & analytics", shortcut: "Alt+D" },
  { name: "Create Event", href: "/dashboard/onboarding", icon: Sparkles, description: "AI-powered setup", shortcut: "Alt+N" },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar, description: "Event calendar", shortcut: "Alt+K" },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, description: "Compare events", shortcut: "Alt+A" },
];

const eventNavigation = [
  { name: "Overview", href: "", icon: CalendarPlus, description: "Event summary & stats" },
  { name: "Inventory", href: "/inventory", icon: Hotel, description: "Room blocks & availability" },
  { name: "Guests", href: "/guests", icon: Users, description: "Guest list & import" },
  { name: "Allocator", href: "/allocator", icon: GripVertical, description: "Smart floor planning" },
  { name: "Attrition", href: "/attrition", icon: AlertTriangle, description: "Yield protection rules" },
  { name: "Check-In", href: "/checkin", icon: QrCode, description: "QR scanner & bulk check-in" },
  { name: "Activity", href: "/activity", icon: Activity, description: "Full audit trail" },
  { name: "Feedback", href: "/feedback", icon: MessageSquare, description: "Guest reviews & sentiment" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Auto-detect eventId from URL path (e.g., /dashboard/events/abc123/...)
  const eventIdMatch = pathname.match(/\/dashboard\/events\/([^/]+)/);
  const eventId = eventIdMatch ? eventIdMatch[1] : undefined;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger with Ctrl/Cmd key and not in input fields
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
      if (!e.altKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      
      switch (e.key.toLowerCase()) {
        case "d":
          e.preventDefault();
          router.push("/dashboard");
          break;
        case "n":
          e.preventDefault();
          router.push("/dashboard/onboarding");
          break;
        case "k":
          e.preventDefault();
          router.push("/dashboard/calendar");
          break;
        case "a":
          if (!e.shiftKey) {
            e.preventDefault();
            router.push("/dashboard/analytics");
          }
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 dark:border-zinc-800 px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="TBO Assemble" className="h-10 w-10" />
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-zinc-100 tracking-tight">TBO Assemble</h1>
          <p className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 tracking-wide uppercase">Group Travel OS</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4" aria-label="Main navigation">
        {/* Main Menu — collapsed to icon row when inside an event */}
        {eventId ? (
          <>
            <div className="mb-3">
              <Link
                href="/dashboard"
                className="group flex items-center gap-2 px-3 py-1 text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center gap-1.5 px-1 mb-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                      isActive
                        ? "bg-gradient-to-br from-[#ff6b35] to-[#e55a2b] text-white shadow-md"
                        : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-300"
                    )}
                    title={`${item.name} ${item.shortcut || ""}`}
                    aria-label={item.name}
                  >
                    <item.icon className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="mb-2">
              <p className="px-3 text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Main Menu</p>
            </div>
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                      isActive
                        ? "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-100 dark:border-orange-900/50 shadow-sm"
                        : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                    )}
                  >
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-gradient-to-br from-[#ff6b35] to-[#e55a2b] text-white shadow-md"
                        : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 group-hover:bg-gray-200 dark:group-hover:bg-zinc-700 group-hover:text-gray-700 dark:group-hover:text-zinc-300"
                    )}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        isActive ? "text-orange-700 dark:text-orange-400" : "text-gray-700 dark:text-zinc-300 group-hover:text-gray-900 dark:group-hover:text-zinc-100"
                      )}>
                        {item.name}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 truncate">{item.description}</p>
                    </div>
                    {item.shortcut && !isActive && (
                      <span className="hidden lg:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 border border-gray-200 dark:border-zinc-700">
                        {item.shortcut}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight className="h-4 w-4 text-orange-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {eventId && (
          <>
            <div className="my-4 px-3">
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-zinc-700 to-transparent" />
            </div>
            <div className="mb-2">
              <p className="px-3 text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Event Management</p>
            </div>
            <div className="space-y-1">
              {eventNavigation.map((item) => {
                const href = `/dashboard/events/${eventId}${item.href}`;
                const isActive = pathname === href;
                return (
                  <Link
                    key={item.name}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                      isActive
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/50 shadow-sm"
                        : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                    )}
                  >
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md"
                        : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 group-hover:bg-gray-200 dark:group-hover:bg-zinc-700 group-hover:text-gray-700 dark:group-hover:text-zinc-300"
                    )}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        isActive ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-zinc-300 group-hover:text-gray-900 dark:group-hover:text-zinc-100"
                      )}>
                        {item.name}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 truncate">{item.description}</p>
                    </div>
                    {isActive && (
                      <ChevronRight className="h-4 w-4 text-blue-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* User Profile + Help */}
      <div className="border-t border-gray-100 dark:border-zinc-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 text-sm font-semibold text-white shadow-md">
            {user?.name ? user.name.split(" ").map(n => n[0]).join("") : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">{user?.name || "User"}</p>
            <p className="text-[10px] text-gray-500 dark:text-zinc-400 truncate">{user?.role || "TBO Travel Solutions"}</p>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
            title="Help & Documentation"
            aria-label="Help & Documentation"
            onClick={() => window.open('https://tbo.com', '_blank')}
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-md lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5 text-gray-700 dark:text-zinc-300" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 transform transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5 text-gray-500 dark:text-zinc-400" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex h-screen w-72 flex-col border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {sidebarContent}
      </aside>
    </>
  );
}
