"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Sparkles, Hotel, Users, AlertTriangle, ArrowRight, Shield, Zap,
  BarChart3, Globe, CheckCircle2, FileText, QrCode, TrendingUp,
  Clock, Star, ChevronRight, Layers, MessageSquare, IndianRupee,
  Menu, X, Quote, Heart,
} from "lucide-react";

/* ───────────────────────────────────────────────
   Mouse-reactive animated particle network
   ─────────────────────────────────────────────── */
function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number; baseO: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouse = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouse);

    const isMobile = canvas.width < 768;
    for (let i = 0; i < (isMobile ? 25 : 60); i++) {
      const o = Math.random() * 0.25 + 0.08;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.8,
        o,
        baseO: o,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouse.current.x;
      const my = mouse.current.y;

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255,107,53,${0.06 * (1 - dist / 160)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        // Mouse repulsion
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          p.vx += (dx / dist) * force * 0.15;
          p.vy += (dy / dist) * force * 0.15;
          p.o = Math.min(p.baseO * 2.5, 0.6); // brighten near mouse
        } else {
          p.o += (p.baseO - p.o) * 0.02; // fade back
        }

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,107,53,${p.o})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 pointer-events-none opacity-80" aria-hidden="true" />;
}

/* ───────────────────────────────────────────────
   Scroll reveal hook
   ─────────────────────────────────────────────── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ───────────────────────────────────────────────
   Counter animation hook
   ─────────────────────────────────────────────── */
function useCounter(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const step = end / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);
  return { count, ref };
}

/* ───────────────────────────────────────────────
   Tilt-on-hover component
   ─────────────────────────────────────────────── */
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  }, []);

  const handleLeave = useCallback(() => {
    const card = cardRef.current;
    if (card) card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`tilt-card transition-transform duration-300 ease-out ${className}`}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */
export default function Home() {
  const [mobileNav, setMobileNav] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const stat1 = useCounter(4, 1800);
  const stat2 = useCounter(13, 1500);
  const stat3 = useCounter(42, 2000);
  const stat4 = useCounter(60, 1200);

  const revealFeatures = useScrollReveal();
  const revealSteps = useScrollReveal();
  const revealUseCases = useScrollReveal();
  const revealTestimonials = useScrollReveal();
  const revealWhy = useScrollReveal();
  const revealCta = useScrollReveal();

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-zinc-950 transition-colors overflow-x-hidden">
      <AnimatedBackground />

      {/* ─── Navigation ─────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-gray-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="TBO Assemble" className="h-9 w-9" />
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-gray-900 dark:text-zinc-50 tracking-tight leading-tight">TBO Assemble</span>
                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 tracking-[0.2em] uppercase">Group Travel OS</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-1.5">
              {["Features", "How it Works", "Feedback", "Impact"].map((l) => (
                <Link
                  key={l}
                  href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                  className="relative px-3.5 py-2 text-sm font-semibold text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors group"
                >
                  {l}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 group-hover:w-4/5 bg-gradient-to-r from-[#ff6b35] to-[#e55a2b] rounded-full transition-all duration-300" />
                </Link>
              ))}
              <Link href="/dashboard" className="px-3.5 py-2 text-sm font-semibold text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Dashboard</Link>
            </div>
            <div className="flex items-center gap-2.5">
              <ThemeToggle />
              <Link href="/dashboard" className="hidden sm:inline-flex items-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
                Sign In
              </Link>
              <Link href="/dashboard/onboarding" className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#ff6b35] to-[#e55a2b] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/25 hover:shadow-lg hover:-translate-y-0.5 transition-all btn-shimmer">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <button onClick={() => setMobileNav(!mobileNav)} className="md:hidden p-2 rounded-lg text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800" aria-label="Toggle navigation menu" aria-expanded={mobileNav}>
                {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {mobileNav && (
            <div className="md:hidden border-t border-gray-100 dark:border-zinc-800 py-2 space-y-0.5 pb-3 animate-fade-in">
              {[
                { href: "#features", label: "Features" },
                { href: "#how-it-works", label: "How it Works" },
                { href: "#feedback", label: "Feedback" },
                { href: "#impact", label: "Impact" },
                { href: "/dashboard", label: "Dashboard" },
                { href: "/dashboard/onboarding", label: "Get Started" },
              ].map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMobileNav(false)} className="block px-3 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg">
                  {l.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* ─── Trust Marquee ────────────────────────────── */}
      <section className="py-3 border-b border-gray-100 dark:border-zinc-800/50 bg-gray-50/50 dark:bg-zinc-900/30 overflow-hidden">
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-gray-50 dark:from-zinc-900 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-gray-50 dark:from-zinc-900 to-transparent z-10" />
          <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(2)].map((_, idx) => (
              <div key={idx} className="flex items-center gap-8 px-4">
                {[
                  { icon: Sparkles, text: "AI Contract Parsing" },
                  { icon: Hotel, text: "Room Block Management" },
                  { icon: Users, text: "Visual Guest Allocator" },
                  { icon: AlertTriangle, text: "Attrition Tracking" },
                  { icon: QrCode, text: "QR Check-In" },
                  { icon: MessageSquare, text: "WhatsApp Nudges" },
                  { icon: FileText, text: "Auto Invoicing" },
                  { icon: Heart, text: "Wedding & MICE" },
                  { icon: BarChart3, text: "Real-Time Analytics" },
                  { icon: Globe, text: "Branded Microsites" },
                ].map((item) => (
                  <div key={`${idx}-${item.text}`} className="flex items-center gap-2 text-sm text-gray-400 dark:text-zinc-500 font-medium">
                    <item.icon className="h-4 w-4" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Hero ────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Gradient blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-80 h-80 bg-orange-200/30 dark:bg-orange-500/10 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-blue-200/25 dark:bg-blue-500/8 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "1s" }} />
          <div className="absolute top-40 right-1/3 w-56 h-56 bg-purple-200/20 dark:bg-purple-500/8 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "2s" }} />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-10 lg:pt-24 lg:pb-16 relative">
          {/* Floating badges */}
          <div className="hidden lg:block absolute top-24 left-8 animate-float" aria-hidden="true">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-gray-200/60 dark:border-zinc-700/60 rounded-full shadow-lg text-xs font-medium text-gray-700 dark:text-zinc-300">
              <Sparkles className="h-3 w-3 text-purple-500" /> AI-Powered
            </div>
          </div>
          <div className="hidden lg:block absolute top-44 right-12 animate-float-reverse" style={{ animationDelay: "1s" }} aria-hidden="true">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-gray-200/60 dark:border-zinc-700/60 rounded-full shadow-lg text-xs font-medium text-gray-700 dark:text-zinc-300">
              <Clock className="h-3 w-3 text-emerald-500" /> 60s Setup
            </div>
          </div>
          <div className="hidden lg:block absolute bottom-24 left-16 animate-float" style={{ animationDelay: "2s" }} aria-hidden="true">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-gray-200/60 dark:border-zinc-700/60 rounded-full shadow-lg text-xs font-medium text-gray-700 dark:text-zinc-300">
              <TrendingUp className="h-3 w-3 text-blue-500" /> Live Tracking
            </div>
          </div>

          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 border border-orange-200/60 dark:border-orange-800/40 px-3.5 py-1 text-xs font-medium text-orange-700 dark:text-orange-400 mb-6 shadow-sm">
              <Zap className="h-3 w-3" />
              <span>VOYAGEHACK 3.0</span>
              <span className="w-px h-3 bg-orange-200 dark:bg-orange-700" />
              <span className="text-orange-600 dark:text-orange-300">Team IIITDards</span>
            </div>

            {/* Heading with animated gradient */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-gray-900 dark:text-zinc-50 leading-[1.05] tracking-tighter mb-6">
              The Operating System for<br />
              <span className="text-gradient-animated">Group Travel</span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Transform hotel room block management from spreadsheet chaos into an intelligent, automated workflow. Parse contracts with AI, allocate guests visually, and protect your revenue — all in one platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <Link href="/dashboard/onboarding" className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#e55a2b] px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-orange-500/20 hover:shadow-2xl hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all animate-glow btn-shimmer">
                <Sparkles className="h-4 w-4" />
                Start 60-Second Setup
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-7 py-3.5 text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all">
                <BarChart3 className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
                View Live Demo
              </Link>
            </div>

            {/* Trust points */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-zinc-400">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /><span>No credit card required</span></div>
              <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-blue-500" /><span>Enterprise-grade security</span></div>
              <div className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-purple-500" /><span>MICE & Destination Weddings</span></div>
            </div>

            {/* Demo event link */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs">
              <Link href="/event/grand-hyatt-annual-conference" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/40 text-blue-700 dark:text-blue-400 font-medium hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors">
                <Globe className="h-3 w-3" /> View Sample MICE Microsite
              </Link>
              <Link href="/event/royal-rajputana-wedding" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-800/40 text-pink-700 dark:text-pink-400 font-medium hover:bg-pink-100 dark:hover:bg-pink-950/50 transition-colors">
                <Heart className="h-3 w-3" /> View Sample Wedding Microsite
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ───────────────────────────────────── */}
      <section id="impact" className="py-16 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm relative overflow-hidden">
        {/* Animated dot grid */}
        <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #ff6b35 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[
              { ref: stat1.ref, value: stat1.count, suffix: "", label: "Core Modules", icon: Hotel, color: "text-orange-500", ring: "group-hover:ring-orange-500/20" },
              { ref: stat2.ref, value: stat2.count, suffix: "", label: "Prisma Models", icon: Star, color: "text-yellow-500", ring: "group-hover:ring-yellow-500/20" },
              { ref: stat3.ref, value: stat3.count, suffix: "+", label: "API Endpoints", icon: TrendingUp, color: "text-emerald-500", ring: "group-hover:ring-emerald-500/20" },
              { ref: stat4.ref, value: stat4.count, suffix: "s", label: "AI Setup Time", icon: Clock, color: "text-blue-500", ring: "group-hover:ring-blue-500/20" },
            ].map((s) => (
              <div
                key={s.label}
                ref={s.ref}
                className={`group text-center p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50 shadow-sm hover:shadow-xl ring-4 ring-transparent ${s.ring} transition-all duration-500 hover:-translate-y-1`}
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 dark:bg-zinc-700/50 mb-2 group-hover:scale-110 transition-transform duration-300">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <p className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-zinc-50 tabular-nums tracking-tight">
                  {s.value.toLocaleString("en-IN")}{s.suffix}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1.5 font-semibold uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features (Bento Grid) ────────────────────── */}
      <section id="features" className="py-16 lg:py-24 relative overflow-hidden">
        {/* Soft radial mesh */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-200/20 dark:bg-purple-500/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-200/20 dark:bg-blue-500/5 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-orange-200/15 dark:bg-orange-500/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '6s' }} />
        </div>
        {/* Diagonal lines pattern */}
        <div className="absolute inset-0 -z-10 opacity-[0.02] dark:opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(135deg, #ff6b35 0, #ff6b35 1px, transparent 0, transparent 50%)', backgroundSize: '24px 24px' }} />
        <div ref={revealFeatures} className="reveal mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-[0.15em] mb-4">
              <Layers className="h-3.5 w-3.5" /> Core Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-zinc-50 mb-4 tracking-tight">Four Pillars of Intelligence</h2>
            <p className="text-base sm:text-lg text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium">
              Purpose-built features addressing core pain points of group travel inventory management across India&apos;s booming MICE and wedding industry.
            </p>
          </div>

          {/* Bento grid: 2 large on top, 2 smaller on bottom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
            {[
              {
                icon: Sparkles, title: "GenAI Contract Parsing",
                desc: "Upload your hotel contract PDF and event invitation. Our GPT-4o pipeline extracts room blocks, negotiated rates, dates, attrition penalties, and even theme colours — generating a branded microsite in under 60 seconds.",
                gradient: "from-purple-500 to-indigo-600",
                bg: "bg-gradient-to-br from-purple-50 to-indigo-50/50 dark:from-purple-950/40 dark:to-indigo-950/20",
                border: "border-purple-100/80 dark:border-purple-800/30",
                glow: "hover:shadow-purple-500/10",
              },
              {
                icon: Users, title: "Visual Proximity Allocator",
                desc: "Intuitive drag-and-drop to assign guests to specific floors and wings. Honour proximity requests like 'near the bride's family' with smart visual cues, VIP prioritisation, and real-time capacity tracking.",
                gradient: "from-blue-500 to-cyan-600",
                bg: "bg-gradient-to-br from-blue-50 to-cyan-50/50 dark:from-blue-950/40 dark:to-cyan-950/20",
                border: "border-blue-100/80 dark:border-blue-800/30",
                glow: "hover:shadow-blue-500/10",
              },
              {
                icon: AlertTriangle, title: "Smart-Yield Protection",
                desc: "Real-time tracking of release deadlines with visual timelines. Auto-calculate at-risk revenue in ₹, trigger WhatsApp nudges to pending guests, and prevent costly attrition penalties.",
                gradient: "from-amber-500 to-orange-600",
                bg: "bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/20",
                border: "border-amber-100/80 dark:border-amber-800/30",
                glow: "hover:shadow-amber-500/10",
              },
              {
                icon: Hotel, title: "Experience Bundling Engine",
                desc: "Dynamic add-on management for airport transfers, gala passes, spa packages. Generate invoices with GST-compliant itemised billing and clearly marked included perks.",
                gradient: "from-emerald-500 to-teal-600",
                bg: "bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-950/20",
                border: "border-emerald-100/80 dark:border-emerald-800/30",
                glow: "hover:shadow-emerald-500/10",
              },
            ].map((f) => (
              <TiltCard key={f.title}>
                <div className={`group relative rounded-2xl border ${f.border} ${f.bg} p-6 sm:p-7 hover:shadow-2xl ${f.glow} transition-all duration-500 h-full overflow-hidden`}>
                  {/* Decorative gradient circle */}
                  <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${f.gradient} rounded-full opacity-[0.07] group-hover:opacity-[0.12] group-hover:scale-125 transition-all duration-700`} />

                  <div className="relative">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} text-white mb-4 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-50 mb-2.5 tracking-tight">{f.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it Works ──────────────────────────────── */}
      <section id="how-it-works" className="py-16 lg:py-24 bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-950 relative noise overflow-hidden">
        {/* Animated floating circles */}
        <div className="absolute -z-0 top-10 left-10 w-20 h-20 rounded-full border border-blue-200/40 dark:border-blue-700/20 animate-float" />
        <div className="absolute -z-0 top-1/3 right-16 w-14 h-14 rounded-full border border-indigo-200/30 dark:border-indigo-700/15 animate-float-reverse" style={{ animationDelay: '2s' }} />
        <div className="absolute -z-0 bottom-20 left-1/4 w-10 h-10 rounded-full bg-gradient-to-br from-blue-200/20 to-indigo-200/20 dark:from-blue-500/5 dark:to-indigo-500/5 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute -z-0 bottom-1/3 right-1/3 w-16 h-16 rounded-full border-2 border-dashed border-orange-200/25 dark:border-orange-700/15 animate-spin-slow" />
        <div ref={revealSteps} className="reveal mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.15em] mb-4">
              <Zap className="h-3.5 w-3.5" /> Workflow
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-zinc-50 mb-4 tracking-tight">From Contract to Microsite in Minutes</h2>
            <p className="text-base sm:text-lg text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium">A streamlined three-step workflow that replaces weeks of manual coordination.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { step: "01", title: "Upload Documents", desc: "Drop your hotel contract PDF and event invitation image. Our GenAI pipeline parses room types, rates, dates, and extracts theme colours for branding.", icon: FileText, color: "from-orange-500 to-amber-500", ring: "ring-orange-500/20" },
              { step: "02", title: "Review & Customise", desc: "Verify AI-extracted data, adjust room blocks, configure add-ons, set attrition rules, and fine-tune your branded event microsite.", icon: Layers, color: "from-blue-500 to-indigo-500", ring: "ring-blue-500/20" },
              { step: "03", title: "Go Live & Track", desc: "Share your microsite link with guests. Monitor bookings in real-time, allocate rooms, track revenue, and auto-nudge pending RSVPs.", icon: TrendingUp, color: "from-emerald-500 to-teal-500", ring: "ring-emerald-500/20" },
            ].map((item, idx) => (
              <div key={item.step} className="relative group">
                {/* Connector line */}
                {idx < 2 && (
                  <div className="hidden md:flex absolute top-12 left-[60%] w-[80%] items-center">
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-300 dark:from-zinc-600 to-transparent" />
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-700 -mr-1">
                      <ChevronRight className="h-3 w-3 text-gray-400 dark:text-zinc-500" />
                    </div>
                  </div>
                )}
                <div className={`text-center rounded-2xl bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50 p-6 sm:p-8 hover:shadow-xl ring-4 ring-transparent group-hover:${item.ring} hover:-translate-y-1 transition-all duration-500`}>
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white mb-4 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-700 text-[10px] font-bold text-gray-500 dark:text-zinc-400 tracking-widest uppercase mb-3">
                    Step {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-50 mb-2.5 tracking-tight">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Use Cases ────────────────────────────────── */}
      <section className="py-16 lg:py-24 relative overflow-hidden">
        {/* Hexagonal dot pattern */}
        <div className="absolute inset-0 -z-10 opacity-[0.025] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1.2px, transparent 1.2px)', backgroundSize: '24px 42px', backgroundPosition: '0 0, 12px 21px' }} />
        {/* Gradient blobs */}
        <div className="absolute -z-10 top-20 right-0 w-[400px] h-[350px] bg-gradient-to-bl from-pink-200/20 via-rose-200/10 to-transparent dark:from-pink-500/5 dark:via-rose-500/3 rounded-full blur-[80px]" />
        <div className="absolute -z-10 bottom-20 left-0 w-[350px] h-[300px] bg-gradient-to-tr from-emerald-200/20 via-teal-200/10 to-transparent dark:from-emerald-500/5 dark:via-teal-500/3 rounded-full blur-[80px]" />
        <div ref={revealUseCases} className="reveal mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/40 text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-[0.15em] mb-4">
              <Globe className="h-3.5 w-3.5" /> Use Cases
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-zinc-50 mb-4 tracking-tight">Built for India&apos;s Biggest Occasions</h2>
            <p className="text-base sm:text-lg text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium">Whether it&apos;s a 500-guest destination wedding in Udaipur or a 3-day corporate summit in Mumbai, TBO Assemble handles the complexity.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {[
              { title: "Destination Weddings", desc: "Manage multi-day celebrations across hotels — sangeet, mehendi, reception. Group guests by family, allocate VIP suites, and track RSVPs.", icon: Heart, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-950/30", border: "border-pink-100 dark:border-pink-900/30", gradient: "from-pink-500/10 via-transparent" },
              { title: "MICE Conferences", desc: "Coordinate corporate room blocks with negotiated rates. Handle speaker suites, delegate rooms, and networking event passes.", icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-100 dark:border-blue-900/30", gradient: "from-blue-500/10 via-transparent" },
              { title: "Sports Tournaments", desc: "Block rooms for team delegations. Allocate by team, manage meal packages, and generate check-in lists for venue entry.", icon: Zap, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-100 dark:border-amber-900/30", gradient: "from-amber-500/10 via-transparent" },
              { title: "College Fests & Reunions", desc: "Affordable room blocks for student groups. Bulk import attendees, auto-assign rooms, and share booking links via WhatsApp.", icon: MessageSquare, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-100 dark:border-green-900/30", gradient: "from-green-500/10 via-transparent" },
              { title: "Religious Pilgrimages", desc: "Group pilgrimage bookings across multiple dharamshalas and hotels. Manage dietary preferences and temple visit add-ons.", icon: Globe, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-100 dark:border-purple-900/30", gradient: "from-purple-500/10 via-transparent" },
              { title: "Film & Production Shoots", desc: "Block rooms near shooting locations. Manage crew tiers — talent suites, crew rooms, equipment storage — with daily rate tracking.", icon: Star, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-100 dark:border-indigo-900/30", gradient: "from-indigo-500/10 via-transparent" },
            ].map((uc) => (
              <TiltCard key={uc.title}>
                <div className={`group relative rounded-2xl border ${uc.border} bg-white dark:bg-zinc-800/50 p-6 sm:p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 h-full overflow-hidden`}>
                  {/* Subtle gradient accent */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${uc.gradient} to-transparent rounded-bl-full opacity-60 dark:opacity-30 pointer-events-none`} />
                  <div className="relative">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${uc.bg} mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                      <uc.icon className={`h-5 w-5 ${uc.color}`} />
                    </div>
                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-zinc-50 mb-2 tracking-tight">{uc.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed font-medium">{uc.desc}</p>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────────── */}
      <section id="feedback" className="py-16 lg:py-24 bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-950 relative noise overflow-hidden">
        {/* Warm radial glow */}
        <div className="absolute inset-0 -z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-amber-100/30 to-transparent dark:from-amber-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 left-10 w-[250px] h-[250px] bg-gradient-to-tr from-orange-100/20 to-transparent dark:from-orange-500/5 rounded-full blur-[60px] animate-pulse" style={{ animationDuration: '7s' }} />
          <div className="absolute bottom-10 right-10 w-[250px] h-[250px] bg-gradient-to-tl from-yellow-100/20 to-transparent dark:from-yellow-500/5 rounded-full blur-[60px] animate-pulse" style={{ animationDuration: '9s', animationDelay: '2s' }} />
        </div>
        {/* Star pattern */}
        <div className="absolute inset-0 -z-0 opacity-[0.015] dark:opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 1.5px, transparent 1.5px)', backgroundSize: '48px 48px' }} />
        <div ref={revealTestimonials} className="reveal mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-[0.15em] mb-4">
              <Quote className="h-3.5 w-3.5" /> Beta Feedback
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-zinc-50 mb-4 tracking-tight">What Our Early Testers Say</h2>
            <p className="text-base sm:text-lg text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium">We shared this prototype with real travel professionals for hands-on testing. Here&apos;s their feedback.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {[
              {
                quote: "The drag-and-drop room allocator is a game-changer. What used to take me hours on Excel took minutes here. Just needs bulk upload support and it's perfect.",
                name: "Priya Sharma",
                role: "Wedding Planner · Beta Tester",
                location: "Jaipur",
                stars: 5,
              },
              {
                quote: "I tested the attrition tracking and deadline alerts — exactly what we've been missing. The AI contract parsing picked up dates I would have missed manually. Impressive for a prototype.",
                name: "Arjun Mehta",
                role: "MICE Coordinator · Beta Tester",
                location: "Bengaluru",
                stars: 5,
              },
              {
                quote: "Shared the guest microsite link with my team — they loved the self-service booking and WhatsApp confirmations. If this goes live, it'll save us 20+ calls per event.",
                name: "Neha Kapoor",
                role: "Travel Agent · Beta Tester",
                location: "Mumbai",
                stars: 5,
              },
            ].map((t) => (
              <div key={t.name} className="group relative rounded-2xl border border-gray-100 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50 p-6 sm:p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                {/* Quote mark */}
                <div className="absolute -top-3 left-6">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6b35] to-[#e55a2b] shadow-lg">
                    <Quote className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>

                {/* Stars */}
                <div className="flex gap-0.5 mb-4 mt-2" role="img" aria-label={`${t.stars} out of 5 stars`}>
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-base text-gray-700 dark:text-zinc-300 leading-relaxed mb-5 italic font-medium">&ldquo;{t.quote}&rdquo;</p>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-zinc-700/50">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6b35] to-[#e55a2b] text-white font-bold text-sm shadow-md">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400">{t.role} · {t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why TBO Assemble ──────────────────────────── */}
      <section className="py-16 lg:py-24 relative overflow-hidden">
        {/* Wavy gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-50/40 to-transparent dark:via-orange-950/10" />
          <div className="absolute top-1/3 left-1/4 w-[600px] h-[200px] bg-gradient-to-r from-orange-200/15 to-amber-200/15 dark:from-orange-500/5 dark:to-amber-500/5 rounded-full blur-[60px] rotate-12 animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[180px] bg-gradient-to-l from-blue-200/15 to-indigo-200/15 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-full blur-[60px] -rotate-6 animate-pulse" style={{ animationDuration: '10s', animationDelay: '3s' }} />
        </div>
        {/* Cross-dot pattern */}
        <div className="absolute inset-0 -z-10 opacity-[0.02] dark:opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #f97316 1px, transparent 1px), radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundPosition: '0 0, 20px 20px' }} />
        <div ref={revealWhy} className="reveal mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Problem side */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-4">
                <AlertTriangle className="h-3 w-3" /> The Problem
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-zinc-50 mb-5 tracking-tight">Why the Industry Needs This</h2>
              <p className="text-base text-gray-500 dark:text-zinc-400 mb-6 leading-relaxed font-medium">
                India&apos;s group travel industry manages thousands of crore in hotel room blocks annually — yet most agents still rely on spreadsheets, WhatsApp groups, and manual emails. This leads to:
              </p>
              <div className="space-y-3">
                {[
                  "Missed attrition deadlines leading to heavy penalty charges",
                  "4-6 hours wasted per event on manual guest allocation",
                  "High booking drop-off due to clunky reservation processes",
                  "Zero real-time visibility into room block utilisation",
                ].map((p) => (
                  <div key={p} className="flex items-start gap-3 p-3 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                      <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">{p}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Solution side */}
            <div className="relative">
              {/* Decorative spinning ring */}
              <div className="absolute -inset-4 rounded-3xl opacity-50">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#ff6b35]/20 via-transparent to-[#0066cc]/20 animate-spin-slow" />
              </div>
              <div className="relative rounded-2xl border border-gray-100 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50 p-6 sm:p-8 shadow-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-5">
                  <CheckCircle2 className="h-3 w-3" /> The Solution
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-50 mb-5 tracking-tight">With TBO Assemble, you get:</h3>
                <div className="space-y-3.5">
                  {[
                    { icon: Sparkles, text: "60-second AI-powered event setup from contract PDF", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
                    { icon: QrCode, text: "Branded microsite with QR code check-in for every guest", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
                    { icon: AlertTriangle, text: "Automated attrition alerts via WhatsApp before deadlines", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
                    { icon: IndianRupee, text: "Real-time revenue tracking with GST-ready invoicing", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
                    { icon: Users, text: "Visual drag-and-drop room allocation with proximity matching", color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-950/30" },
                    { icon: BarChart3, text: "Comparative analytics across all your events", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
                  ].map((b) => (
                    <div key={b.text} className="flex items-start gap-3 group">
                      <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${b.bg} group-hover:scale-110 transition-transform duration-300`}>
                        <b.icon className={`h-3.5 w-3.5 ${b.color}`} />
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 leading-relaxed">{b.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Tech Stack Showcase ──────────────────────── */}
      <section className="py-16 lg:py-20 bg-gradient-to-b from-white to-gray-50 dark:from-zinc-950 dark:to-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-[0.02] dark:opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.15em] mb-4">
              <Layers className="h-3.5 w-3.5" /> Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-zinc-50 mb-4 tracking-tight">Built with Modern Technology</h2>
            <p className="text-base sm:text-lg text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto font-medium">Built with a modern, production-ready stack for reliability, speed, and developer experience.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
            {[
              { name: "Next.js 16", desc: "App Router", color: "from-gray-800 to-gray-900 dark:from-gray-100 dark:to-gray-300", textClass: "text-white dark:text-gray-900" },
              { name: "GPT-4o", desc: "Contract AI", color: "from-green-500 to-emerald-600", textClass: "text-white" },
              { name: "Prisma 7", desc: "Type-safe ORM", color: "from-indigo-500 to-purple-600", textClass: "text-white" },
              { name: "TypeScript", desc: "Full-stack", color: "from-blue-500 to-blue-700", textClass: "text-white" },
              { name: "Tailwind v4", desc: "Utility CSS", color: "from-cyan-500 to-blue-500", textClass: "text-white" },
              { name: "Recharts", desc: "Analytics", color: "from-orange-500 to-red-500", textClass: "text-white" },
            ].map((tech) => (
              <div key={tech.name} className="group">
                <div className={`rounded-xl bg-gradient-to-br ${tech.color} p-4 text-center hover:scale-105 hover:shadow-xl transition-all duration-300`}>
                      <p className={`text-sm font-bold ${tech.textClass}`}>{tech.name}</p>
                  <p className={`text-xs ${tech.textClass} opacity-80 mt-0.5 font-medium`}>{tech.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-zinc-500">
              Seeded with realistic Indian data • Full dark mode • Mobile-first responsive • Accessibility-first
            </p>
          </div>
        </div>
      </section>

      {/* ─── Manual vs TBO Assemble Comparison ──────────────────────────────────────── */}
      <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-950/30 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 mb-4">
              ⚡ Why Switch?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-zinc-50 tracking-tight">
              Manual Coordination vs TBO Assemble
            </h2>
            <p className="mt-3 text-gray-500 dark:text-zinc-400 max-w-xl mx-auto text-base font-medium">See how TBO Assemble replaces manual workflows at every step</p>
          </div>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="rounded-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden shadow-sm">
            <div className="grid grid-cols-3">
                <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-700 text-sm font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider">Task</div>
              <div className="p-4 bg-red-50/50 dark:bg-red-950/20 border-b border-l border-gray-200 dark:border-zinc-700 text-sm font-bold text-red-600 dark:text-red-400 text-center uppercase tracking-wider">❌ Manual Way</div>
              <div className="p-4 bg-green-50/50 dark:bg-green-950/20 border-b border-l border-gray-200 dark:border-zinc-700 text-sm font-bold text-green-600 dark:text-green-400 text-center uppercase tracking-wider">✅ TBO Assemble</div>
            </div>
            {[
              ["Contract Parsing", "Read 20-page PDFs manually", "AI extracts in 30 seconds"],
              ["Room Allocation", "Spreadsheet juggling", "Smart auto-allocator"],
              ["Guest Invitations", "Individual emails/calls", "Branded microsites + QR"],
              ["Check-in Process", "Paper lists at lobby", "QR scan, instant verify"],
              ["Attrition Tracking", "Calendar reminders", "Auto deadline alerts"],
              ["Revenue Reports", "Manual Excel formulas", "Real-time analytics"],
              ["Guest Changes", "Phone calls & emails", "Self-service portal"],
              ["Multi-Event Mgmt", "Separate spreadsheets", "Unified dashboard"],
            ].map(([task, manual, tbo]) => (
              <div key={task} className="grid grid-cols-3 group hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                <div className="p-3.5 border-b border-gray-100 dark:border-zinc-800 text-sm font-semibold text-gray-800 dark:text-zinc-200">{task}</div>
                <div className="p-3.5 border-b border-l border-gray-100 dark:border-zinc-800 text-sm text-red-500/80 dark:text-red-400/60 text-center">{manual}</div>
                <div className="p-3.5 border-b border-l border-gray-100 dark:border-zinc-800 text-sm text-green-600 dark:text-green-400 text-center font-semibold">{tbo}</div>
              </div>
            ))}
          </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-base text-gray-500 dark:text-zinc-400 font-semibold">
              <span className="font-extrabold text-[#ff6b35]">Result:</span> What takes 3 days manually, TBO Assemble does in 30 minutes
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────── */}
      <section className="py-16 lg:py-20 relative overflow-hidden">
        {/* Soft ambient glow behind CTA card */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-orange-200/25 via-purple-200/15 to-blue-200/25 dark:from-orange-500/5 dark:via-purple-500/3 dark:to-blue-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        </div>
        <div ref={revealCta} className="reveal mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] via-[#334155] to-[#1e293b]" />
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-60 h-60 bg-orange-500/20 rounded-full blur-3xl animate-pulse-soft" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "1s" }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "2s" }} />
            </div>

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

            <div className="relative z-10 p-8 sm:p-12 lg:p-16 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-white/80 mb-5 backdrop-blur-sm">
                <Sparkles className="h-3 w-3" /> Free to start · No credit card
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5 leading-tight tracking-tight">
                Ready to Transform Your<br className="hidden sm:block" /> Group Bookings?
              </h2>
              <p className="text-base sm:text-lg text-gray-300 mb-8 max-w-xl mx-auto leading-relaxed font-medium">
                See how TBO Assemble replaces spreadsheets with an intelligent, AI-powered workflow. Try the live demo now.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/dashboard/onboarding" className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#e55a2b] px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all animate-glow btn-shimmer">
                  <Sparkles className="h-4 w-4" />
                  Create Your First Event
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/dashboard" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm px-8 py-4 text-sm font-semibold text-white hover:bg-white/10 hover:border-white/30 transition-all">
                  <BarChart3 className="h-4 w-4" />
                  Explore Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────── */}
      <footer className="border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="TBO Assemble" className="h-7 w-7" />
                <div>
                  <span className="font-semibold text-gray-900 dark:text-zinc-100 text-sm">TBO Assemble</span>
                  <p className="text-[10px] text-gray-500 dark:text-zinc-500">Powered by TBO.com</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-500 max-w-sm leading-relaxed">
                The Operating System for Group Travel — AI-powered hotel room block management for MICE events, destination weddings, and corporate retreats across India.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider mb-3">Product</h4>
              <div className="space-y-2">
                {[
                  { href: "/dashboard", label: "Dashboard" },
                  { href: "/dashboard/onboarding", label: "Create Event" },
                  { href: "/dashboard/analytics", label: "Analytics" },
                  { href: "/dashboard/calendar", label: "Calendar View" },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="block text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>

            {/* Demo Events */}
            <div>
              <h4 className="text-xs font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider mb-3">Demo Events</h4>
              <div className="space-y-2">
                {[
                  { href: "/event/grand-hyatt-annual-conference", label: "MICE Conference" },
                  { href: "/event/royal-rajputana-wedding", label: "Destination Wedding" },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="block text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-zinc-500">
              <span>&copy; {new Date().getFullYear()} TBO Tech Pvt. Ltd.</span>
              <span className="hidden sm:inline w-px h-3 bg-gray-300 dark:bg-zinc-700" />
              <span>Built with ❤️ by Team IIITDards for VOYAGEHACK 3.0</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-zinc-600">
              <span>Next.js 16</span>
              <span>·</span>
              <span>GPT-4o</span>
              <span>·</span>
              <span>Prisma 7</span>
              <span>·</span>
              <span>TypeScript</span>
            </div>
          </div>
        </div>
      </footer>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-[#ff6b35] text-white shadow-lg hover:bg-[#e55a2b] transition-all animate-fade-in"
          aria-label="Scroll to top"
        >
          <ChevronRight className="h-5 w-5 -rotate-90" />
        </button>
      )}
    </div>
  );
}
