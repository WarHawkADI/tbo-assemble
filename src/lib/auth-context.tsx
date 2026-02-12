"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  user: { name: string; email: string; role: string } | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo credentials
const DEMO_USERS = [
  { email: "rajesh@tbo.com", password: "tbo2026", name: "Rajesh Kumar", role: "Travel Agent" },
  { email: "admin@tbo.com", password: "admin123", name: "Admin User", role: "Administrator" },
  { email: "demo@tbo.com", password: "demo", name: "Demo User", role: "Travel Agent" },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing session
    try {
      const stored = localStorage.getItem("tbo-auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setIsAuthenticated(true);
      }
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((email: string, password: string): boolean => {
    const found = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (found) {
      const userData = { name: found.name, email: found.email, role: found.role };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem("tbo-auth", JSON.stringify(userData));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("tbo-auth");
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc] dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="TBO Assemble" className="h-12 w-12 animate-pulse" />
          <p className="text-sm text-gray-400 dark:text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
