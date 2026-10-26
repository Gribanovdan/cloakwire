import { describe, expect, it } from "vitest";
import { migrateRuleSetPresets, presetToRuleSet, RULE_SET_PRESETS } from "./presets";
import type { CustomRuleSet } from "./types";

const oldUrl = "https://raw.githubusercontent.com/Loyalsoldier/v2ray-rules-dat/release/geoip-ru.srs";
const currentUrl = "https://raw.githubusercontent.com/Loyalsoldier/geoip/release/srs/ru.srs";

describe("GeoIP RU preset", () => {
  it("uses the published sing-box ruleset for new selections", () => {
    const preset = RULE_SET_PRESETS.find((entry) => entry.tag === "geoip-ru")!;
    expect(presetToRuleSet(preset).url).toBe(currentUrl);
  });

  it("repairs the legacy preset URL without mutating saved settings", () => {
    const saved: CustomRuleSet = { tag: "geoip-ru", type: "remote", format: "binary", url: oldUrl, enabled: false, update_interval: "12h" };
    expect(migrateRuleSetPresets([saved])).toEqual([{ ...saved, url: currentUrl }]);
    expect(saved.url).toBe(oldUrl);
  });

  it("preserves custom, absent and empty URLs and non-remote sets", () => {
    const sets: CustomRuleSet[] = [
      { tag: "geoip-ru", type: "remote", url: "https://custom.test/ru.srs", enabled: true },
      { tag: "missing", type: "remote", enabled: true },
      { tag: "empty", type: "remote", url: "", enabled: true },
      { tag: "local", type: "local", path: "ru.srs", url: oldUrl, enabled: true },
      { tag: "inline", type: "inline", rules: [{ domain: ["example.test"] }], url: oldUrl, enabled: true },
    ];
    expect(migrateRuleSetPresets(sets)).toEqual(sets);
    expect(migrateRuleSetPresets([])).toEqual([]);
    expect(migrateRuleSetPresets(undefined)).toEqual([]);
    expect(migrateRuleSetPresets(null)).toEqual([]);
  });
});
