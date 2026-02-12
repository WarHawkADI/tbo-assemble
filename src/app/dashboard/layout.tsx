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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>
      <div className="flex h-dvh bg-gray-50 dark:bg-zinc-950">
        <Sidebar />
        <main id="main-content" className="flex-1 overflow-auto">
          <div className="p-4 lg:p-8 pt-16 lg:pt-8">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
      <KeyboardShortcutsOverlay />
    </AuthGuard>
  );
}
