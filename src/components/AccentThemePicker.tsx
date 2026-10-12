import { Check, Monitor, Moon, Palette, Sparkles, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccentTheme } from "@/hooks/useAccentTheme";
import { useThemeMode, THEME_MODES } from "@/lib/themeMode";
import { useI18n } from "@/lib/i18n";
import type { AccentId } from "@/lib/accentTheme";

interface Props {
  compact?: boolean;
}

export function AccentThemePicker({ compact = false }: Props) {
  const { accent, setAccent, accents } = useAccentTheme();
  const { mode, setMode } = useThemeMode();
  const { t } = useI18n();

  return (
    <div className={cn("space-y-4", compact ? "text-xs" : "")}>
      {/* Theme Mode Segmented Picker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-tight text-foreground">
            <Sun className="h-4 w-4 text-theme-accent" />
            <span>{t("settings.themeMode")}</span>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground uppercase">
            {mode}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {THEME_MODES.map((item) => {
            const isSelected = mode === item.id;
            const Icon =
              item.id === "light"
                ? Sun
                : item.id === "dark"
                  ? Moon
                  : item.id === "oled"
                    ? Sparkles
                    : Monitor;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center transition-all",
                  "border-border/80 bg-background/50 hover:bg-background hover:border-foreground/20",
                  isSelected &&
                    "border-theme-accent bg-theme-subtle ring-1 ring-theme-accent font-semibold"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isSelected ? "text-theme-accent" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    isSelected ? "text-theme-accent" : "text-foreground"
                  )}
                >
                  {t(item.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent Color Swatches */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-tight text-foreground">
          <Palette className="h-4 w-4 text-theme-accent" />
          <span>{t("settings.accentColor")}</span>
        </div>

        <div className="grid grid-cols-5 gap-2.5">
          {accents.map((item) => {
            const isSelected = accent === item.id;
            const labelKey =
              item.id === "cyan"
                ? "settings.accentCyan"
                : item.id === "violet"
                  ? "settings.accentViolet"
                  : item.id === "amber"
                    ? "settings.accentAmber"
                    : item.id === "rose"
                      ? "settings.accentRose"
                      : "settings.accentEmerald";
            const localizedLabel = t(labelKey);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setAccent(item.id as AccentId)}
                title={localizedLabel}
                className={cn(
                  "group relative flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-all duration-200",
                  isSelected
                    ? "border-foreground/30 bg-muted/60 shadow-sm"
                    : "border-border/60 bg-card/40 hover:border-border hover:bg-muted/30",
                )}
              >
                <span
                  className="relative flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105"
                  style={{
                    backgroundColor: item.colorHex,
                    boxShadow: isSelected
                      ? `0 0 14px 2px ${item.colorHex}77`
                      : `0 0 6px 0px ${item.colorHex}33`,
                  }}
                >
                  {isSelected && (
                    <Check className="h-4 w-4 text-zinc-950 stroke-[3]" />
                  )}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium transition-colors",
                    isSelected ? "text-foreground font-semibold" : "text-muted-foreground",
                  )}
                >
                  {localizedLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
