import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}) {
  const variants: Record<string, string> = {
    default: "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border border-orange-200/50 dark:from-orange-900/40 dark:to-amber-900/40 dark:text-orange-300 dark:border-orange-700/50",
    secondary: "bg-gray-100 text-gray-700 border border-gray-200/50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600/50",
    destructive: "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200/50 dark:from-red-900/40 dark:to-rose-900/40 dark:text-red-300 dark:border-red-700/50",
    outline: "border-2 border-gray-200 text-gray-600 bg-white dark:border-zinc-600 dark:text-zinc-300 dark:bg-zinc-800",
    success: "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border border-emerald-200/50 dark:from-emerald-900/40 dark:to-teal-900/40 dark:text-emerald-300 dark:border-emerald-700/50",
    warning: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200/50 dark:from-amber-900/40 dark:to-yellow-900/40 dark:text-amber-300 dark:border-amber-700/50",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
