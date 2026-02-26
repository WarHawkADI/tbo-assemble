"use client";

import { useState, useEffect, useRef } from "react";
import {
  Activity,
  UserPlus,
  Users,
  Calendar,
  Send,
  CheckCircle,
  ArrowUpDown,
  ClipboardList,
  AlertTriangle,
  Download,
  Clock,
  Filter,
  RefreshCw,
} from "lucide-react";

interface LogEntry {
  id: string;
  action: string;
  details: string;
  actor: string;
  createdAt: string;
}

interface ActivityLogProps {
  eventId: string;
}

const actionIcons: Record<string, React.ElementType> = {
  guest_added: UserPlus,
  booking_created: Calendar,
  nudge_sent: Send,
  guest_checked_in: CheckCircle,
  room_upgraded: ArrowUpDown,
  room_downgraded: ArrowUpDown,
  rooming_list_exported: Download,
  booking_cancelled: AlertTriangle,
  waitlist_joined: ClipboardList,
  auto_allocate: Activity,
  guest_updated: Users,
  guest_removed: Users,
};

const actionColors: Record<string, string> = {
  guest_added: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  booking_created: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  nudge_sent: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  guest_checked_in: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  room_upgraded: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  room_downgraded: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  rooming_list_exported: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  booking_cancelled: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  waitlist_joined: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  auto_allocate: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  guest_updated: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  guest_removed: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export function ActivityLog({ eventId }: ActivityLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [newEntryIds, setNewEntryIds] = useState<Set<string>>(new Set());
  const previousLogsRef = useRef<string[]>([]);

  const fetchActivity = (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    fetch(`/api/events/${eventId}/activity?limit=50`)
      .then((res) => res.json())
      .then((data) => {
        const newLogs = Array.isArray(data) ? data : [];
        
        // Find new entries (entries that weren't in previous fetch)
        if (previousLogsRef.current.length > 0) {
          const newIds = newLogs
            .filter((log: LogEntry) => !previousLogsRef.current.includes(log.id))
            .map((log: LogEntry) => log.id);
          if (newIds.length > 0) {
            setNewEntryIds(new Set(newIds));
            // Clear the "new" highlight after 3 seconds
            setTimeout(() => setNewEntryIds(new Set()), 3000);
          }
        }
        
        previousLogsRef.current = newLogs.map((log: LogEntry) => log.id);
        setLogs(newLogs);
        setLoading(false);
        setRefreshing(false);
      })
      .catch(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useEffect(() => {
    const interval = setInterval(() => { fetchActivity(); }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const exportActivityCSV = () => {
    const headers = ["Action", "Details", "Actor", "Timestamp"];
    const rows = filteredLogs.map((l) => [
      l.action,
      l.details,
      l.actor,
      new Date(l.createdAt).toLocaleString("en-IN"),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-log.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = actionFilter === "all"
    ? logs
    : logs.filter((l) => l.action === actionFilter);

  const uniqueActions = [...new Set(logs.map((l) => l.action))];

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-500 dark:text-zinc-400">No activity yet</p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          Actions will appear here as they happen
        </p>
      </div>
    );
  }

  return (
    <div className="relative" data-tour="activity-log">
      {/* Filter and Export Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            title="Filter by action type"
            aria-label="Filter by action type"
            className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Actions ({logs.length})</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} ({logs.filter((l) => l.action === action).length})
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={exportActivityCSV}
          className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          <Download className="w-3 h-3" /> Export
        </button>
        <button
          onClick={() => fetchActivity(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 ml-3"
          title="Refresh activity log"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} /> 
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Timeline line */}
      <div className="absolute left-5 top-12 bottom-0 w-px bg-zinc-200 dark:bg-zinc-700" />

      <ol className="space-y-4 list-none">
        {filteredLogs.map((log) => {
          const Icon = actionIcons[log.action] || Activity;
          const colorClass =
            actionColors[log.action] || "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
          const time = new Date(log.createdAt);
          const relativeTime = getRelativeTime(time);

          return (
            <li key={log.id} className={`flex gap-3 relative transition-all duration-500 ${newEntryIds.has(log.id) ? 'animate-pulse bg-blue-50 dark:bg-blue-900/20 -mx-2 px-2 rounded-lg' : ''}`}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-transform duration-300 ${newEntryIds.has(log.id) ? 'scale-110 ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-zinc-900' : ''} ${colorClass}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 bg-white dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-700/50 p-3">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {log.details}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <time dateTime={log.createdAt}>{relativeTime}</time>
                  </span>
                  <span className="text-xs text-zinc-300 dark:text-zinc-600">•</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {log.actor}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
