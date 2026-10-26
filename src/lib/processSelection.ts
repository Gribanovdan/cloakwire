import type { RoutingOptions } from "./types";

/** Keep the simple app-selection modes aligned with the default route. */
export function applyProcessSelection(
  routing: RoutingOptions,
  kind: "vpn" | "direct",
  next: string[],
): Partial<RoutingOptions> {
  const vpnProcesses = kind === "vpn" ? next : routing.vpn_processes;
  return {
    [kind === "vpn" ? "vpn_processes" : "direct_processes"]: next,
    final_outbound: vpnProcesses.length > 0 ? "direct" : "proxy",
  };
}

/** Return the final executable component without persisting its local path. */
export function executableNameFromPath(value: string): string | null {
  const normalized = value.trim().replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  const name = parts.at(-1)?.trim();
  if (!name || name === "." || name === "..") return null;
  return name;
}
