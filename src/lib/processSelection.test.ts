import { describe, expect, it } from "vitest";
import { applyProcessSelection, executableNameFromPath } from "./processSelection";
import { DEFAULT_SETTINGS } from "./defaults";

describe("applyProcessSelection", () => {
  const base = DEFAULT_SETTINGS.routing;

  it("uses direct as the default while an include list is active", () => {
    expect(applyProcessSelection(base, "vpn", ["chrome.exe"]))
      .toMatchObject({ vpn_processes: ["chrome.exe"], final_outbound: "direct" });
    expect(applyProcessSelection({ ...base, vpn_processes: ["chrome.exe"] }, "direct", ["bank.exe"]))
      .toMatchObject({ direct_processes: ["bank.exe"], final_outbound: "direct" });
  });

  it("restores proxy mode when the include list is cleared", () => {
    expect(applyProcessSelection({ ...base, vpn_processes: ["chrome.exe"], final_outbound: "direct" }, "vpn", []))
      .toMatchObject({ vpn_processes: [], final_outbound: "proxy" });
    expect(applyProcessSelection(base, "direct", ["bank.exe"]))
      .toMatchObject({ direct_processes: ["bank.exe"], final_outbound: "proxy" });
  });
});

describe("executableNameFromPath", () => {
  it("extracts a Windows executable name", () => {
    expect(executableNameFromPath(String.raw`C:\Program Files\Example App\example.exe`)).toBe("example.exe");
  });

  it("accepts Unix-style paths for other desktop targets", () => {
    expect(executableNameFromPath("/usr/local/bin/example")).toBe("example");
  });

  it("rejects empty or directory-only values", () => {
    expect(executableNameFromPath("   ")).toBeNull();
    expect(executableNameFromPath("..")) .toBeNull();
  });
});
