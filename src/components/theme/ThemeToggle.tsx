"use client";

import { useState } from "react";
import { Sun, Moon, Palette, ChevronDown, Check } from "lucide-react";
import { useTheme, Theme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeOptions: { id: Theme; label: string; iconBg: string; textColor: string; desc: string }[] = [
    {
      id: "light",
      label: "Light Clean",
      iconBg: "bg-emerald-500",
      textColor: "text-emerald-700",
      desc: "Fresh Clinical Emerald",
    },
    {
      id: "dark",
      label: "Dark Obsidian",
      iconBg: "bg-slate-900 border border-slate-700",
      textColor: "text-slate-200",
      desc: "High Contrast Low-Eye-Strain",
    },
    {
      id: "brown",
      label: "Warm Sepia",
      iconBg: "bg-[#78350f]",
      textColor: "text-amber-800",
      desc: "Organic Earth & Amber",
    },
    {
      id: "gray",
      label: "Slate Gray",
      iconBg: "bg-[#475569]",
      textColor: "text-slate-600",
      desc: "Minimalist Industrial Steel",
    },
  ];

  const currentOption = themeOptions.find((o) => o.id === theme) || themeOptions[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200/90 hover:bg-slate-100 transition-all text-xs font-semibold text-slate-700"
        title="Change Visual Theme"
      >
        <span className={`w-3 h-3 rounded-full ${currentOption.iconBg}`} />
        <span className="hidden sm:inline">{currentOption.label}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Select Global Color Theme
            </div>
            <div className="space-y-1">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all ${
                    theme === opt.id
                      ? "bg-slate-100 font-bold text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3.5 h-3.5 rounded-full ${opt.iconBg}`} />
                    <div>
                      <p className="font-semibold text-xs leading-tight">{opt.label}</p>
                      <p className="text-[10px] text-slate-400">{opt.desc}</p>
                    </div>
                  </div>
                  {theme === opt.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
