"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Event layout with real-time booking sync
export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  
  // Listen for cross-tab booking notifications and auto-refresh
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    
    const channel = new BroadcastChannel('tbo-bookings');
    channel.onmessage = (event) => {
      if (event.data?.type === 'new-booking') {
        // Refresh server components to show new booking data
        router.refresh();
      }
    };
    
    return () => channel.close();
  }, [router]);
  
  return <>{children}</>;
}
