"use client";

import { useEffect, useState, useCallback } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  shape: "square" | "circle" | "triangle";
}

const COLORS = [
  "#ff6b35", "#e55a2b", "#10b981", "#3b82f6", "#8b5cf6",
  "#f59e0b", "#ec4899", "#06b6d4", "#f97316", "#14b8a6",
];

export function useConfetti() {
  const [active, setActive] = useState(false);
  const trigger = useCallback(() => setActive(true), []);
  return { active, trigger, reset: () => setActive(false) };
}

export function ConfettiExplosion({
  active,
  onComplete,
}: {
  active: boolean;
  onComplete?: () => void;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;

    const newParticles: Particle[] = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 40,
      rotation: Math.random() * 360,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4,
      speedX: (Math.random() - 0.5) * 15,
      speedY: -(Math.random() * 12 + 5),
      opacity: 1,
      shape: (["square", "circle", "triangle"] as const)[Math.floor(Math.random() * 3)],
    }));

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [active, onComplete]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.shape !== "triangle" ? p.color : "transparent",
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            borderLeft: p.shape === "triangle" ? `${p.size / 2}px solid transparent` : undefined,
            borderRight: p.shape === "triangle" ? `${p.size / 2}px solid transparent` : undefined,
            borderBottom: p.shape === "triangle" ? `${p.size}px solid ${p.color}` : undefined,
            transform: `rotate(${p.rotation}deg)`,
            "--confetti-x": `${p.speedX * 20}px`,
            "--confetti-speed": `${Math.abs(p.speedY) * 0.15}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
