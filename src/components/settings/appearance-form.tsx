"use client";

import { Check, Laptop, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useThemeSettings } from "@/components/theme-provider";
import { PALETTES, type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

const MODES: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "浅色", icon: Sun },
  { id: "dark", label: "深色", icon: Moon },
  { id: "system", label: "跟随系统", icon: Laptop },
];

export function AppearanceForm() {
  const { mode, palette, setMode, setPalette } = useThemeSettings();

  return (
    <Card className="border-0 bg-card/85">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">外观与主题</CardTitle>
        <p className="text-sm text-muted-foreground">为你的工作台挑一套舒服的色彩。选择后立即生效。</p>
      </CardHeader>
      <CardContent className="space-y-7">
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">显示模式</p>
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-muted/60 p-1.5">
            {MODES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  aria-pressed={mode === m.id}
                  className={cn(
                    "flex min-h-10 items-center justify-center gap-2 rounded-xl px-2 text-xs font-medium transition-all duration-200 sm:text-sm",
                    mode === m.id
                      ? "bg-card text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.08)] ring-1 ring-border/60"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">主题配色</p>
            <span className="text-xs text-muted-foreground">{PALETTES.length} 种风格</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPalette(p.id)}
                aria-pressed={palette === p.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300 ease-(--ease-apple) hover:-translate-y-0.5 hover:shadow-lg",
                  palette === p.id
                    ? "border-primary/50 bg-primary/5 shadow-[0_8px_24px_-16px_var(--primary)] ring-1 ring-primary/20"
                    : "border-border/70 bg-card/70 hover:border-primary/30"
                )}
              >
                <span className="block rounded-xl border border-black/5 p-2.5 shadow-inner" style={{ backgroundColor: p.surface }}>
                  <span className="mb-2 flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-black/20" />
                    <span className="size-1.5 rounded-full bg-black/10" />
                    <span className="size-1.5 rounded-full bg-black/10" />
                  </span>
                  <span className="flex gap-2">
                    <span className="w-7 rounded-md bg-white/65 p-1.5 shadow-sm">
                      <span className="mb-1 block h-1 w-3 rounded-full" style={{ backgroundColor: p.swatch }} />
                      <span className="block h-1 w-4 rounded-full bg-black/10" />
                    </span>
                    <span className="flex-1 space-y-1 rounded-md bg-white/90 p-1.5 shadow-sm">
                      <span className="block h-1.5 w-12 rounded-full bg-black/20" />
                      <span className="block h-1 w-16 rounded-full bg-black/10" />
                      <span className="block h-1 w-10 rounded-full" style={{ backgroundColor: p.swatch, opacity: 0.55 }} />
                    </span>
                  </span>
                </span>
                <span className="mt-3 flex items-center gap-2.5">
                  <span className="size-5 shrink-0 rounded-full ring-2 ring-white/80 shadow-sm" style={{ backgroundColor: p.swatch }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{p.label}</span>
                    <span className="block text-xs text-muted-foreground">{p.description}</span>
                  </span>
                  {palette === p.id && <Check className="size-4 shrink-0 text-primary" />}
                </span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
