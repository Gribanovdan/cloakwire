import { useState, useRef, useEffect, useMemo } from "react";
import {
  Play,
  Square,
  ArrowDownCircle,
  ArrowUpCircle,
  Activity,
  Radio,
  Globe,
  ShieldCheck,
  RotateCcw,
  History,
  Trash2,
  Server,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  SpeedTestRunner,
  loadSpeedTestHistory,
  clearSpeedTestHistory,
  type SpeedTestProgress,
  type SpeedTestResult,
} from "@/lib/speedtest";

export interface SpeedTestTabProps {
  vpnActive: boolean;
  activeProfileName: string | null;
}

export function SpeedTestTab({ vpnActive, activeProfileName }: SpeedTestTabProps) {
  const { t } = useI18n();
  const runnerRef = useRef<SpeedTestRunner | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<SpeedTestProgress>({
    phase: "idle",
    currentSpeed: 0,
    progressPercent: 0,
    pingMs: 0,
    jitterMs: 0,
    downloadMbps: 0,
    uploadMbps: 0,
    samples: [],
  });

  const [lastResult, setLastResult] = useState<SpeedTestResult | null>(null);
  const [history, setHistory] = useState<SpeedTestResult[]>(() => loadSpeedTestHistory());

  useEffect(() => {
    runnerRef.current = new SpeedTestRunner();
    return () => {
      runnerRef.current?.stop();
    };
  }, []);

  const handleStart = async () => {
    if (!runnerRef.current) return;
    setIsRunning(true);
    setLastResult(null);

    const meta = {
      serverName: activeProfileName || (vpnActive ? "VPN Tunnel" : "Direct"),
      vpnActive,
    };

    try {
      const res = await runnerRef.current.run(meta, (p) => {
        setProgress(p);
      });
      setLastResult(res);
      setHistory(loadSpeedTestHistory());
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Speed test error:", err);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    runnerRef.current?.stop();
    setIsRunning(false);
    setProgress((prev) => ({
      ...prev,
      phase: "idle",
      currentSpeed: 0,
      progressPercent: 0,
    }));
  };

  const handleClearHistory = () => {
    clearSpeedTestHistory();
    setHistory([]);
  };

  // Speedometer Arc calculation
  // Angle: -120 to +120 degrees (240 deg span)
  const maxDialSpeed = 200; // 200 Mbps scale
  const displaySpeed = isRunning
    ? progress.currentSpeed
    : lastResult
      ? lastResult.downloadSpeed
      : 0;

  const speedRatio = Math.min(1, Math.max(0, displaySpeed / maxDialSpeed));
  const radius = 70;
  const strokeWidth = 10;
  const center = 90;
  const arcLength = 2 * Math.PI * radius * (240 / 360);
  const dashOffset = arcLength * (1 - speedRatio);

  // Phase status text
  const phaseLabel = useMemo(() => {
    switch (progress.phase) {
      case "ping":
        return t("speedtest.phasePing");
      case "download":
        return t("speedtest.phaseDownload");
      case "upload":
        return t("speedtest.phaseUpload");
      case "done":
        return t("speedtest.phaseDone");
      case "error":
        return progress.error || t("common.error");
      default:
        return lastResult ? t("speedtest.phaseDone") : t("speedtest.subtitle");
    }
  }, [progress.phase, progress.error, lastResult, t]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-6 animate-fadeIn">
      {/* Top Header Card */}
      <Card className="bento-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-theme-accent" />
                {t("speedtest.title")}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {t("speedtest.subtitle")}
              </CardDescription>
            </div>

            {/* VPN Route Badge */}
            <div className="shrink-0">
              {vpnActive ? (
                <div className="flex items-center gap-2 rounded-full border border-theme-accent/30 bg-theme-subtle px-3 py-1 text-xs font-medium text-theme-accent">
                  <ShieldCheck className="h-4 w-4" />
                  <span>
                    {t("speedtest.vpnActive")}:{" "}
                    <strong className="font-semibold text-foreground">
                      {activeProfileName || "Active"}
                    </strong>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>{t("speedtest.directRoute")}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Hero Speedometer Card */}
      <Card className="bento-card relative overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          {/* Circular SVG Speedometer Gauge */}
          <div className="relative flex items-center justify-center w-52 h-44">
            <svg className="w-52 h-44 overflow-visible" viewBox="0 0 180 160">
              {/* Background Track Arc */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeDasharray={`${arcLength} 999`}
                strokeLinecap="round"
                transform={`rotate(150 ${center} ${center})`}
                className="text-border/60"
              />
              {/* Active Value Arc */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeDasharray={`${arcLength} 999`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform={`rotate(150 ${center} ${center})`}
                className="text-theme-accent transition-all duration-150 ease-out"
                style={{
                  filter: "drop-shadow(0 0 8px var(--theme-accent))",
                }}
              />
            </svg>

            {/* Speed readout inside gauge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
              <span className="text-4xl font-extrabold tracking-tight tabular-nums text-foreground">
                {displaySpeed.toFixed(1)}
              </span>
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
                Mbps
              </span>
            </div>
          </div>

          {/* Phase status indicator */}
          <p className="mt-2 text-xs font-mono text-muted-foreground min-h-[1.25rem]">
            {phaseLabel}
          </p>

          {/* Progress Bar (when active) */}
          <div className="w-full max-w-xs bg-secondary/80 rounded-full h-1.5 mt-3 overflow-hidden border border-border/40">
            <div
              className="bg-theme-accent h-full transition-all duration-200 ease-out"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>

          {/* Start / Stop Controls */}
          <div className="mt-6 flex items-center gap-3">
            {isRunning ? (
              <Button
                variant="destructive"
                size="lg"
                onClick={handleStop}
                className="gap-2 px-6 shadow-md"
              >
                <Square className="h-4 w-4" />
                <span>{t("speedtest.stopTest")}</span>
              </Button>
            ) : (
              <Button
                variant="default"
                size="lg"
                onClick={handleStart}
                className="gap-2 px-8 shadow-lg bg-theme-accent text-zinc-950 font-bold hover:brightness-110 active:scale-95 transition-all"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>{t("speedtest.startTest")}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4 Metrics Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Download */}
        <Card className="bento-card">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">{t("speedtest.download")}</span>
              <ArrowDownCircle className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tabular-nums text-foreground">
                {(progress.downloadMbps || lastResult?.downloadSpeed || 0).toFixed(1)}
                <span className="text-xs font-normal text-muted-foreground ml-1">Mbps</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload */}
        <Card className="bento-card">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">{t("speedtest.upload")}</span>
              <ArrowUpCircle className="h-4 w-4 text-blue-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tabular-nums text-foreground">
                {(progress.uploadMbps || lastResult?.uploadSpeed || 0).toFixed(1)}
                <span className="text-xs font-normal text-muted-foreground ml-1">Mbps</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ping */}
        <Card className="bento-card">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">{t("speedtest.ping")}</span>
              <Activity className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tabular-nums text-foreground">
                {progress.pingMs || lastResult?.ping || 0}
                <span className="text-xs font-normal text-muted-foreground ml-1">ms</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jitter */}
        <Card className="bento-card">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">{t("speedtest.jitter")}</span>
              <Radio className="h-4 w-4 text-purple-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tabular-nums text-foreground">
                {progress.jitterMs || lastResult?.jitter || 0}
                <span className="text-xs font-normal text-muted-foreground ml-1">ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network & Edge Details */}
      {(progress.clientIp || lastResult?.clientIp) && (
        <Card className="bento-card">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-theme-accent" />
              <span className="text-muted-foreground">{t("speedtest.clientIp")}:</span>
              <span className="font-mono font-medium text-foreground">
                {progress.clientIp || lastResult?.clientIp}
              </span>
            </div>
            {(progress.location || lastResult?.location) && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t("speedtest.location")}:</span>
                <span className="font-medium text-foreground">
                  {progress.location || lastResult?.location}
                </span>
              </div>
            )}
            {(progress.colo || lastResult?.colo) && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-[11px] px-2 py-0.5">
                  {t("speedtest.colo")}: {progress.colo || lastResult?.colo}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Test History Card */}
      <Card className="bento-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-theme-accent" />
              <CardTitle className="text-sm font-semibold">
                {t("speedtest.recentHistory")}
              </CardTitle>
            </div>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1 px-2"
              >
                <Trash2 className="h-3 w-3" />
                <span>{t("speedtest.clearHistory")}</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {t("speedtest.noHistory")}
            </p>
          ) : (
            <div className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/80">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2 text-xs hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {item.vpnActive ? (
                      <ShieldCheck className="h-4 w-4 text-theme-accent shrink-0" />
                    ) : (
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{item.serverName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}{" "}
                        · {new Date(item.timestamp).toLocaleDateString()}
                        {item.location ? ` · ${item.location}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right tabular-nums">
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground block">Down</span>
                      <span className="font-semibold text-emerald-400">
                        {item.downloadSpeed.toFixed(1)} Mbps
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground block">Up</span>
                      <span className="font-semibold text-blue-400">
                        {item.uploadSpeed.toFixed(1)} Mbps
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground block">Ping</span>
                      <span className="font-medium text-foreground">{item.ping} ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
