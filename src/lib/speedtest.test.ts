import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  calculateJitter,
  loadSpeedTestHistory,
  saveSpeedTestResult,
  clearSpeedTestHistory,
  type SpeedTestResult,
} from "./speedtest";

describe("speed test connectivity", () => {
  it("allows Cloudflare endpoints through the application CSP", () => {
    const config = JSON.parse(
      readFileSync(resolve(process.cwd(), "src-tauri/tauri.conf.json"), "utf8"),
    );
    const connectSrc = config.app.security.csp
      .split(";")
      .find((directive: string) => directive.trim().startsWith("connect-src "));

    expect(connectSrc).toContain("https://speed.cloudflare.com");
  });
});

describe("speedtest", () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    (globalThis as any).localStorage = {
      getItem: (key: string) => mockStore[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStore[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      },
    };
  });

  describe("calculateJitter", () => {
    it("returns 0 for empty or single-item lists", () => {
      expect(calculateJitter([])).toBe(0);
      expect(calculateJitter([25])).toBe(0);
    });

    it("correctly calculates mean absolute difference between sequential pings", () => {
      // differences: |20 - 30| = 10, |30 - 25| = 5, |25 - 35| = 10
      // mean diff: (10 + 5 + 10) / 3 = 25 / 3 = 8.333 -> 8.3
      const pings = [20, 30, 25, 35];
      expect(calculateJitter(pings)).toBe(8.3);
    });
  });

  describe("history storage", () => {
    it("saves and loads speed test results in chronological order", () => {
      expect(loadSpeedTestHistory()).toEqual([]);

      const sample1: SpeedTestResult = {
        id: "test-1",
        timestamp: 1000,
        serverName: "Frankfurt VLESS",
        vpnActive: true,
        ping: 28,
        jitter: 2.1,
        downloadSpeed: 145.2,
        uploadSpeed: 48.6,
      };

      const sample2: SpeedTestResult = {
        id: "test-2",
        timestamp: 2000,
        serverName: "Amsterdam HY2",
        vpnActive: true,
        ping: 22,
        jitter: 1.4,
        downloadSpeed: 210.8,
        uploadSpeed: 64.0,
      };

      saveSpeedTestResult(sample1);
      const afterTwo = saveSpeedTestResult(sample2);

      expect(afterTwo.length).toBe(2);
      expect(afterTwo[0].id).toBe("test-2");
      expect(afterTwo[1].id).toBe("test-1");

      const loaded = loadSpeedTestHistory();
      expect(loaded.length).toBe(2);
      expect(loaded[0].serverName).toBe("Amsterdam HY2");

      clearSpeedTestHistory();
      expect(loadSpeedTestHistory()).toEqual([]);
    });
  });
});
