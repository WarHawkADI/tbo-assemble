import Sidebar from "@/components/dashboard/sidebar";
import { PageTransition } from "@/components/ui/page-transition";
import { AuthGuard } from "@/components/auth-guard";
import { KeyboardShortcutsOverlay } from "@/components/dashboard/keyboard-shortcuts";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50 dark:bg-zinc-950">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-8 pt-16 lg:pt-8">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
      <KeyboardShortcutsOverlay />
    </AuthGuard>
  );
}
