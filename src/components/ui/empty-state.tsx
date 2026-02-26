import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  iconClassName?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  iconClassName,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in", className)}>
      <div className={cn(
        "relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-800/50 mb-5 shadow-sm",
        iconClassName
      )}>
        {/* Subtle pulse background */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/5 to-transparent animate-pulse" style={{ animationDuration: '3s' }} />
        <Icon className="h-9 w-9 text-zinc-400 dark:text-zinc-500 relative z-10" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-5 leading-relaxed">{description}</p>
      )}
      {action}
    </div>
  );
}
