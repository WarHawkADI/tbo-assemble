"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Eye, EyeOff, LogIn, Sparkles, Shield, Zap, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // If already authenticated, redirect (in effect to avoid setState-during-render)
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      const success = login(email, password);
      if (success) {
        router.push("/dashboard");
      } else {
        setError("Invalid email or password. Try the demo credentials below.");
        setIsLoading(false);
      }
    }, 800); // Simulate loading
  };

  const fillDemo = () => {
    setEmail("rajesh@tbo.com");
    setPassword("tbo2026");
    setError("");
  };

  return (
    <div className="min-h-screen flex bg-[#fafbfc] dark:bg-zinc-950">
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] via-[#334155] to-[#0f172a]" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4s" }} />
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "6s" }} />
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative z-10 flex flex-col justify-center px-16 py-12">
          <div className="flex items-center gap-3 mb-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="TBO Assemble" className="h-12 w-12" />
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">TBO Assemble</h1>
              <p className="text-xs font-semibold text-gray-400 tracking-[0.2em] uppercase">Group Travel OS</p>
            </div>
          </div>

          <h2 className="text-4xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            The Operating System<br />for <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Group Travel</span>
          </h2>

          <p className="text-gray-400 text-base leading-relaxed mb-10 max-w-md">
            AI-powered hotel room block management for MICE events, destination weddings, and corporate retreats across India.
          </p>

          <div className="space-y-4">
            {[
              { icon: Sparkles, text: "AI contract parsing in 60 seconds", color: "text-purple-400" },
              { icon: Shield, text: "Smart attrition protection with auto-alerts", color: "text-blue-400" },
              { icon: Zap, text: "Branded microsites with QR check-in", color: "text-amber-400" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <span className="text-sm text-gray-300 font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-500">
              Built by Team IIITDards for VOYAGEHACK 3.0 · Powered by TBO.com
            </p>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="TBO Assemble" className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">TBO Assemble</h1>
              <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 tracking-[0.2em] uppercase">Group Travel OS</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-zinc-50 tracking-tight">Welcome back</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">Sign in to manage your group travel events</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-gray-900 dark:text-zinc-100 text-sm placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-gray-900 dark:text-zinc-100 text-sm placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#e55a2b] text-white font-semibold text-sm shadow-lg shadow-orange-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 btn-shimmer"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" /> Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Demo Credentials</p>
            <div className="space-y-1.5 text-xs text-amber-600 dark:text-amber-400/80 font-mono">
              <p>Email: <span className="font-semibold">rajesh@tbo.com</span></p>
              <p>Password: <span className="font-semibold">tbo2026</span></p>
            </div>
            <button
              onClick={fillDemo}
              className="mt-3 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 underline underline-offset-2 transition-colors"
            >
              Auto-fill demo credentials →
            </button>
          </div>

          <div className="mt-6 flex flex-col items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-zinc-400 hover:text-[#ff6b35] transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Home
            </Link>
            <p className="text-center text-xs text-gray-400 dark:text-zinc-600">
              VOYAGEHACK 3.0 Prototype · Team IIITDards
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
