"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Bell, X, AlertTriangle, CheckCircle2, Users, Calendar, TrendingUp } from "lucide-react";

const NOTIFICATIONS = [
  { id: 1, type: "warning", icon: AlertTriangle, title: "Attrition deadline approaching", desc: "Royal Rajputana Wedding — 5 rooms at risk. Deadline in 2 days.", time: "2 min ago", unread: true },
  { id: 2, type: "success", icon: CheckCircle2, title: "3 new bookings confirmed", desc: "Grand Hyatt Conference received 3 new guest confirmations.", time: "15 min ago", unread: true },
  { id: 3, type: "info", icon: Users, title: "Guest check-in complete", desc: "Vikram Mehta checked in at Royal Rajputana Wedding.", time: "1 hour ago", unread: true },
  { id: 4, type: "info", icon: Calendar, title: "Event starting soon", desc: "Grand Hyatt Annual Conference starts in 3 days.", time: "3 hours ago", unread: false },
  { id: 5, type: "success", icon: TrendingUp, title: "Revenue milestone reached", desc: "Royal Rajputana Wedding crossed ₹15,00,000 in bookings.", time: "Yesterday", unread: false },
];

const COLLAB_USERS = [
  { name: "Priya S", color: "from-pink-500 to-rose-500" },
  { name: "Arjun M", color: "from-blue-500 to-indigo-500" },
];

export function DashboardHeader() {
  const { user } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [collabCount] = useState(Math.floor(Math.random() * 2) + 2);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight">Dashboard</h1>
        <p className="text-base text-gray-500 dark:text-zinc-400 mt-1">
          Manage your group travel events and track performance
        </p>
      </div>
      <div className="flex items-center gap-3">
        {/* Live Collaboration Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40">
          <div className="flex -space-x-2">
            {COLLAB_USERS.slice(0, collabCount).map((u) => (
              <div key={u.name} className={`h-5 w-5 rounded-full bg-gradient-to-br ${u.color} flex items-center justify-center text-[8px] font-bold text-white ring-2 ring-white dark:ring-zinc-900`}>
                {u.name[0]}
              </div>
            ))}
          </div>
          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">{collabCount} online</span>
        </div>

        {/* Live Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-700 dark:text-green-400">Live</span>
        </div>

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-600 transition-all shadow-sm"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-zinc-800">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotif && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-2xl z-50 overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotif(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-zinc-800">
                {notifications.map((n) => (
                  <div key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors ${n.unread ? "bg-orange-50/30 dark:bg-orange-950/10" : ""}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.type === "warning" ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" : n.type === "success" ? "bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400" : "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"}`}>
                      <n.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                        {n.title}
                        {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{n.desc}</p>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
                <p className="text-[10px] text-center text-gray-400 dark:text-zinc-500">All caught up! 🎉</p>
              </div>
            </div>
          )}
        </div>

        {/* Welcome */}
        <div className="hidden sm:block text-sm text-gray-500 dark:text-zinc-400">
          Welcome back, <span className="font-semibold text-gray-900 dark:text-zinc-100">{user?.name?.split(" ")[0] || "User"}</span>
        </div>
      </div>
    </div>
  );
}
