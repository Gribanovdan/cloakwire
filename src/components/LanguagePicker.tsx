import { Globe } from "lucide-react";
import { useI18n, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguagePicker() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-theme-accent" />
          <span className="text-xs font-medium text-foreground">
            {t("settings.language")}
          </span>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground uppercase">
          {locale}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {SUPPORTED_LOCALES.map((item) => {
          const isSelected = locale === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setLocale(item.id)}
              className={cn(
                "group relative flex flex-col items-center justify-center rounded-xl p-2.5 text-center transition-all",
                "border border-border/80 bg-background/50 hover:bg-background hover:border-foreground/20",
                isSelected &&
                  "border-theme-accent bg-theme-subtle ring-1 ring-theme-accent font-semibold"
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium",
                  isSelected ? "text-theme-accent" : "text-foreground"
                )}
              >
                {item.nativeLabel}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
