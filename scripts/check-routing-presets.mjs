// Exercise the real picker and API wrapper; native IPC is mocked.
// Run: node scripts/check-routing-presets.mjs (requires Playwright Chromium).
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';
const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const server = await createServer({ root, server: { host: '127.0.0.1', port: 1420, strictPort: true, hmr: false } });
await server.listen();
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  page.on('pageerror', error => console.error(error.message));
  await page.addInitScript(() => {
    window.__TAURI_INTERNALS__ = { invoke: async (command, args) => {
      if (command === 'start_managed_singbox') window.captured = { command, args };
      return [];
    }};
  });
  await page.route('http://127.0.0.1:1420/bypass-check', async route => route.fulfill({
    contentType: 'text/html', body: await server.transformIndexHtml('/bypass-check', `
      <div id="root"></div><script type="module">
      import React from '/node_modules/.vite/deps/react.js';
      import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
      import { RoutingTab } from '/src/components/routing/RoutingTab.tsx';
      import { DEFAULT_SETTINGS } from '/src/lib/defaults.ts';
      import { api } from '/src/lib/api.ts';
      import '/src/index.css';
      function Harness() {
        const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);
        window.submitSettings = () => api.startManaged({ manualOutbounds: [], subscriptionLinks: [], selectAllSubscriptionLinks: false, settings });
        return React.createElement(RoutingTab, { profiles: [], settings, onSettingsChange: setSettings });
      }
      ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Harness));
      </script>`),
  }));
  await page.goto('http://127.0.0.1:1420/bypass-check');
  await page.getByText('Advanced Rules & Route Engine', { exact: true }).click();
  await page.getByRole('button', { name: 'Bypass RU (needs geoip-ru rule-set)', exact: false }).click();
  const row = page.locator('div').filter({ has: page.locator('code', { hasText: /^geoip-ru$/ }) }).filter({ has: page.getByText('GeoIP — Russia (Loyalsoldier)', { exact: true }) });
  await row.last().getByRole('button').click();
  await page.evaluate(() => window.submitSettings());
  const captured = await page.evaluate(() => window.captured);
  if (captured.command !== 'start_managed_singbox' || captured.args.input.settings.routing.rule_sets.length !== 1) throw new Error('Unexpected IPC request');
  const ruleSet = captured.args.input.settings.routing.rule_sets[0];
  if (ruleSet.tag !== 'geoip-ru' || ruleSet.enabled !== true || ruleSet.url !== 'https://raw.githubusercontent.com/Loyalsoldier/geoip/release/srs/ru.srs') throw new Error('Unexpected GeoIP RU rule-set: ' + JSON.stringify(ruleSet));
  const rule = captured.args.input.settings.routing.rules[0];
  if (rule.label !== 'Bypass RU' || rule.matchers.rule_set?.[0] !== 'geoip-ru' || rule.action.outbound !== 'direct') throw new Error('Bypass RU preset did not reach the IPC request: ' + JSON.stringify(rule));
  console.log('PASS: Bypass RU picker preserves its matchers/action through api.startManaged and includes the enabled rule-set.');
} finally {
  await browser?.close();
  await server.close();
}
