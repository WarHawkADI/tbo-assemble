"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { category: "Navigation", items: [
    { keys: ["Alt", "D"], desc: "Go to Dashboard" },
    { keys: ["Alt", "N"], desc: "Create New Event" },
    { keys: ["Alt", "K"], desc: "Open Calendar" },
    { keys: ["Alt", "A"], desc: "Open Analytics" },
    { keys: ["?"], desc: "Show Keyboard Shortcuts" },
  ]},
  { category: "Actions", items: [
    { keys: ["Ctrl", "S"], desc: "Save / Submit Form" },
    { keys: ["Esc"], desc: "Close Modal / Cancel" },
    { keys: ["Tab"], desc: "Navigate Between Fields" },
  ]},

];

export function KeyboardShortcutsOverlay() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, toggle]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 w-full max-w-lg max-h-[80vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#e55a2b] flex items-center justify-center">
              <Keyboard className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">Keyboard Shortcuts</h2>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400">Power-user navigation</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh] space-y-5">
          {SHORTCUTS.map((group) => (
            <div key={group.category}>
              <h3 className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-[0.15em] mb-2.5">
                {group.category}
              </h3>
              <div className="space-y-1.5">
                {group.items.map((shortcut) => (
                  <div
                    key={shortcut.desc}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <span className="text-sm text-gray-700 dark:text-zinc-300">{shortcut.desc}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i}>
                          <kbd className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 shadow-sm">
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-[10px] text-gray-400 mx-0.5">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
          <p className="text-[10px] text-center text-gray-400 dark:text-zinc-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-zinc-700 text-[10px] font-semibold">?</kbd> to toggle this overlay
          </p>
        </div>
      </div>
    </div>
  );
}
