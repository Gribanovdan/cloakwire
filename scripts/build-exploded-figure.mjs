import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KIT_URL = "file:///C:/Users/%D0%90%D0%BB%D0%B5%D0%BA%D1%81%D0%B5%D0%B9/.gemini/config/skills/anatomy/kit/iso-kit.mjs";
const k = await import(KIT_URL);

const WIDTH = 820;
const HEIGHT = 660;

// Dimensions of each layer tray (world coordinates in mm/px)
const TRAY = { x: -85, y: -55, w: 170, d: 110, r: 6 };
const TRAY_H = 8;
const CORNER_POSTS = [
  [-73, -43],
  [73, -43],
  [-73, 43],
  [73, 43]
];

// Vertical spacing in exploded mode
const BASE_Z = 0;
const LAYER_OFFSETS = [
  0,    // L1: Physical NIC (anchored)
  62,   // L2: Kernel TUN
  124,  // L3: Dual Engine Router
  186,  // L4: Crypto Vault
  248   // L5: Control Console
];

// Fit isometric camera projection to contain the full exploded stack
const P = k.fitProjection(
  [
    ...k.boxCorners(TRAY, -12, 0),
    ...CORNER_POSTS.map(([x, y]) => [x, y, 275]),
    [TRAY.x - 12, TRAY.y - 12, LAYER_OFFSETS[4] + TRAY_H + 24],
    [TRAY.x + TRAY.w + 12, TRAY.y + TRAY.d + 12, LAYER_OFFSETS[4] + TRAY_H + 24]
  ],
  WIDTH,
  HEIGHT,
  { pad: 42, azimuth: 42, elevation: 26 }
);

const at = (pt) => k.iso(pt, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

// --- Guide Posts & Base Feet ---
function buildGuideRods() {
  const out = [];
  // 4 corner vertical dowel tie-rods extending through the entire height
  for (const [x, y] of byDepth(CORNER_POSTS)) {
    out.push(S(k.cylinder(x, y, 2.2, -6, 272, P, 16), { tone: "lo", crease: "none" }));
    out.push(L(k.ring(x, y, 2.2, 266, P, 16), { tone: "hi" }));
    out.push(D([at([x, y, 266])], { size: 0.45, tone: "lit" }));
  }
  return out.join("");
}

function buildBaseStand() {
  const out = [];
  // Rubber feet under base plate
  for (const [x, y] of byDepth(k.corners(TRAY, 16))) {
    out.push(S(k.cylinder(x, y, 6, -10, 4, P, 20), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 4.5, -6, 6, P, 20), { tone: "mid" }));
  }
  return out.join("");
}

// Helper: Common chassis tray for each layer
function buildTrayShell(z, layerId, layerTitle) {
  const out = [];
  // Main milled aluminum tray
  out.push(S(k.slabOf(TRAY, z, TRAY_H, P, 6, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(TRAY, 3), z + TRAY_H, P), { tone: "lo" }));

  // Corner guide bushings on the tray
  for (const [x, y] of CORNER_POSTS) {
    out.push(S(k.cylinder(x, y, 4.2, z, TRAY_H + 2.5, P, 18), { tone: "hi" }));
    out.push(L(k.ring(x, y, 4.2, z + TRAY_H + 2.5, P, 18), { tone: "lo" }));
    out.push(D([at([x, y, z + TRAY_H + 2.5])], { size: 0.45, tone: "lit" }));
  }

  // Engraved layer label on the front chamfer
  const tagPos = [0, TRAY.y + TRAY.d - 6];
  out.push(k.faceTextSvg(k.topMatrix(tagPos, z + TRAY_H + 0.2, P, "x"), layerTitle, { size: 2.2, tone: "hi", anchor: "middle" }));

  return out.join("");
}

// --- LAYER 1: Physical Network Layer (NIC & Ethernet) ---
function buildLayer1(z) {
  const out = [buildTrayShell(z, 1, "LEVEL 1 · PHYSICAL ADAPTER & LAN GATEWAY")];

  // Dual RJ-45 shielded socket blocks on left
  const rj45 = { x: -70, y: -22, w: 22, d: 38, r: 1.5 };
  out.push(S(k.slabOf(rj45, z + TRAY_H, 12, P, 3, 0.4), { tone: "lo" }));
  out.push(L(k.planOutline(rj45, z + TRAY_H + 12, P), { tone: "mid" }));
  // Jack openings
  out.push(S(k.slabOf({ x: -68, y: -16, w: 18, d: 11, r: 1 }, z + TRAY_H + 3, 7, P, 2), { tone: "lo" }));
  out.push(S(k.slabOf({ x: -68, y: 1, w: 18, d: 11, r: 1 }, z + TRAY_H + 3, 7, P, 2), { tone: "lo" }));
  // Link LEDs
  out.push(D([at([-72, -18, z + TRAY_H + 10]), at([-72, -1, z + TRAY_H + 10])], { size: 0.6, tone: "lit" }));

  // Center Heatsink with machined cooling fins
  const hs = { x: -32, y: -28, w: 56, d: 56, r: 2 };
  out.push(S(k.slabOf(hs, z + TRAY_H, 7, P, 3, 0.5), { tone: "hi" }));
  for (let x = hs.x + 5; x <= hs.x + hs.w - 5; x += 6) {
    const p1 = at([x, hs.y + 4, z + TRAY_H + 7]);
    const p2 = at([x, hs.y + hs.d - 4, z + TRAY_H + 7]);
    out.push(`<line x1="${p1[0].toFixed(1)}" y1="${p1[1].toFixed(1)}" x2="${p2[0].toFixed(1)}" y2="${p2[1].toFixed(1)}" stroke="var(--anatomy-lo)" stroke-width="1.2" stroke-linecap="round" />`);
  }

  // Filter capacitors (cylinders)
  out.push(S(k.cylinder(42, -14, 5.5, z + TRAY_H, 9, P, 18), { tone: "lo" }));
  out.push(S(k.cylinder(42, 12, 5.5, z + TRAY_H, 9, P, 18), { tone: "lo" }));
  out.push(S(k.cylinder(58, 0, 4.5, z + TRAY_H, 7, P, 18), { tone: "lo" }));

  // Bus traces
  const busLine = k.lineOnTop([hs.x + hs.w, 0], [70, 0], z + TRAY_H + 0.3, P);
  out.push(L(busLine, { tone: "lo" }));

  return `<g class="iso-layer" data-layer="1" style="cursor: pointer;">${out.join("")}</g>`;
}

// --- LAYER 2: Kernel Wintun Driver & Packet Queue ---
function buildLayer2(z) {
  const out = [buildTrayShell(z, 2, "LEVEL 2 · WINTUN DRIVER & ZERO-COPY QUEUE")];

  // Recessed central queue chamber
  const queueRecess = { x: -62, y: -30, w: 124, d: 58, r: 3 };
  out.push(S(k.slabOf(queueRecess, z + TRAY_H, 2.5, P, 3), { tone: "lo" }));

  // Twin FIFO queue rails
  for (const y of [-15, 15]) {
    out.push(S(k.slabOf({ x: -55, y: y - 2, w: 110, d: 4, r: 0.8 }, z + TRAY_H + 2.5, 3.5, P, 2), { tone: "hi" }));
    // Vernier ticks along queue
    const t = k.topTicks(-50, 50, 4, 5, y + 2.8, z + TRAY_H + 6, [1.2, 2.2], P);
    out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  }

  // Central Packet Intake Bridge & Wintun Processing Core
  const coreBox = { x: -16, y: -24, w: 32, d: 48, r: 2 };
  out.push(S(k.slabOf(coreBox, z + TRAY_H + 2.5, 7.5, P, 4, 0.5), { tone: "hi" }));
  out.push(D(k.corners(coreBox, 3).map(([x, y]) => at([x, y, z + TRAY_H + 10])), { size: 0.45, tone: "mid" }));
  // Engraved chip core
  out.push(k.faceTextSvg(k.topMatrix([0, 0], z + TRAY_H + 10.1, P, "x"), "WINTUN.SYS", { size: 2.2, tone: "lo", anchor: "middle" }));

  // Sliding Packet Markers on the rails
  for (const [px, py] of [[-32, -15], [26, -15], [-20, 15], [38, 15]]) {
    out.push(S(k.slabOf({ x: px - 3, y: py - 3, w: 6, d: 6, r: 0.8 }, z + TRAY_H + 6, 2.8, P, 2), { tone: "mid" }));
    out.push(D([at([px, py, z + TRAY_H + 8.8])], { size: 0.4, tone: "lit" }));
  }

  return `<g class="iso-layer" data-layer="2" style="cursor: pointer;">${out.join("")}</g>`;
}

// --- LAYER 3: Dual-Core Routing Engine (sing-box + Xray) ---
function buildLayer3(z) {
  const out = [buildTrayShell(z, 3, "LEVEL 3 · DUAL-CORE ENGINE & DETOUR ROUTER")];

  // Core 1 (sing-box) on Left
  const sbBox = { x: -62, y: -24, w: 42, d: 48, r: 3 };
  out.push(S(k.slabOf(sbBox, z + TRAY_H, 6.5, P, 3, 0.4), { tone: "mid" }));
  out.push(k.faceTextSvg(k.topMatrix([-41, 0], z + TRAY_H + 6.6, P, "x"), "SING-BOX CORE", { size: 2.0, tone: "hi", anchor: "middle" }));
  out.push(D([at([-41, -14, z + TRAY_H + 6.6]), at([-41, 14, z + TRAY_H + 6.6])], { size: 0.5, tone: "lit" }));

  // Core 2 (Xray Core) on Right
  const xrBox = { x: 20, y: -24, w: 42, d: 48, r: 3 };
  out.push(S(k.slabOf(xrBox, z + TRAY_H, 6.5, P, 3, 0.4), { tone: "mid" }));
  out.push(k.faceTextSvg(k.topMatrix([41, 0], z + TRAY_H + 6.6, P, "x"), "XRAY CORE", { size: 2.0, tone: "hi", anchor: "middle" }));
  out.push(D([at([41, -14, z + TRAY_H + 6.6]), at([41, 14, z + TRAY_H + 6.6])], { size: 0.5, tone: "lit" }));

  // Central Rotary Detour Diverter Switch
  out.push(S(k.cylinder(0, 0, 15, z + TRAY_H, 4, P, 24), { tone: "lo" }));
  out.push(S(k.cylinder(0, 0, 11, z + TRAY_H + 4, 4.5, P, 24), { tone: "hi" }));
  out.push(L(k.knurl(0, 0, 11, z + TRAY_H + 5, z + TRAY_H + 8.5, 24, P, 0.3), { tone: "lo" }));

  // Diverter pointer channel lines
  const pCenter = at([0, 0, z + TRAY_H + 8.6]);
  const pLeft = at([-10, 0, z + TRAY_H + 8.6]);
  const pRight = at([10, 0, z + TRAY_H + 8.6]);
  out.push(`<line x1="${pCenter[0].toFixed(1)}" y1="${pCenter[1].toFixed(1)}" x2="${pLeft[0].toFixed(1)}" y2="${pLeft[1].toFixed(1)}" stroke="#34d399" stroke-width="1.8" stroke-linecap="round" />`);
  out.push(`<line x1="${pCenter[0].toFixed(1)}" y1="${pCenter[1].toFixed(1)}" x2="${pRight[0].toFixed(1)}" y2="${pRight[1].toFixed(1)}" stroke="#64748b" stroke-width="1.4" stroke-linecap="round" />`);
  out.push(D([pCenter], { size: 0.8, tone: "lit" }));

  return `<g class="iso-layer" data-layer="3" style="cursor: pointer;">${out.join("")}</g>`;
}

// --- LAYER 4: Cryptographic Vault & Obfuscation Core ---
function buildLayer4(z) {
  const out = [buildTrayShell(z, 4, "LEVEL 4 · CRYPTOGRAPHIC VAULT & VISION CIPHER")];

  // Heavy Vault Chassis Housing
  const vaultWall = { x: -50, y: -30, w: 100, d: 60, r: 4 };
  out.push(S(k.slabOf(vaultWall, z + TRAY_H, 8, P, 4, 0.6), { tone: "hi" }));

  // Central Rotating Cipher Cylinder (The Key Drum)
  out.push(S(k.cylinder(0, 0, 18, z + TRAY_H + 8, 5, P, 32), { tone: "lo" }));
  out.push(S(k.cylinder(0, 0, 14, z + TRAY_H + 13, 6, P, 32), { tone: "hi" }));
  out.push(L(k.knurl(0, 0, 14, z + TRAY_H + 14, z + TRAY_H + 19, 32, P, 0.3), { tone: "lo" }));
  out.push(k.faceTextSvg(k.topMatrix([0, 0], z + TRAY_H + 19.1, P, "x"), "REALITY / XTLS", { size: 1.8, tone: "hi", anchor: "middle" }));

  // 4 Optical Masking Prisms around the drum
  const prisms = [
    [-30, -14],
    [-30, 14],
    [30, -14],
    [30, 14]
  ];
  for (const [px, py] of prisms) {
    const prismBox = { x: px - 6, y: py - 6, w: 12, d: 12, r: 1.2 };
    out.push(S(k.slabOf(prismBox, z + TRAY_H + 8, 8, P, 2, 0.3), { tone: "mid" }));
    out.push(D([at([px, py, z + TRAY_H + 16])], { size: 0.45, tone: "lit" }));
  }

  // Laser beam conduits between prisms
  const laser1 = k.lineOnTop([-30, -14], [30, 14], z + TRAY_H + 16.2, P);
  const laser2 = k.lineOnTop([-30, 14], [30, -14], z + TRAY_H + 16.2, P);
  out.push(`<path class="iso-line" d="${laser1}" stroke="#34d399" stroke-width="1.2" opacity="0.8" />`);
  out.push(`<path class="iso-line" d="${laser2}" stroke="#34d399" stroke-width="1.2" opacity="0.8" />`);

  return `<g class="iso-layer" data-layer="4" style="cursor: pointer;">${out.join("")}</g>`;
}

// --- LAYER 5: Control Console & Bento Deck (Tauri UI) ---
function buildLayer5(z) {
  const out = [buildTrayShell(z, 5, "LEVEL 5 · TAURI CONTROL DECK & 60 FPS BENTO")];

  // Recessed Display Window (The Live Traffic Wave Screen)
  const screenBezel = { x: -62, y: -24, w: 72, d: 48, r: 3 };
  out.push(S(k.slabOf(screenBezel, z + TRAY_H, 2.5, P, 3), { tone: "lo" }));
  out.push(L(k.planOutline(screenBezel, z + TRAY_H + 2.5, P), { tone: "hi" }));

  // Inside screen: Live Sine Wave path
  const wavePoints = [];
  for (let step = 0; step <= 24; step++) {
    const u = step / 24;
    const wx = screenBezel.x + 4 + u * (screenBezel.w - 8);
    const wy = screenBezel.y + screenBezel.d / 2 + Math.sin(u * Math.PI * 4) * 12;
    wavePoints.push(at([wx, wy, z + TRAY_H + 2.6]));
  }
  const wavePath = "M" + wavePoints.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L");
  out.push(`<path class="iso-wave-path" d="${wavePath}" fill="none" stroke="#34d399" stroke-width="1.6" style="filter: drop-shadow(0 0 5px #10b981);" />`);

  // Master Power Dial & Mode Lever on Right
  const dialX = 38;
  const dialY = 0;
  out.push(S(k.cylinder(dialX, dialY, 16, z + TRAY_H, 6, P, 28), { tone: "mid" }));
  out.push(L(k.ring(dialX, dialY, 16, z + TRAY_H + 6, P, 28), { tone: "hi" }));
  out.push(S(k.cylinder(dialX, dialY, 11, z + TRAY_H + 6, 7, P, 28), { tone: "hi" }));
  out.push(L(k.knurl(dialX, dialY, 11, z + TRAY_H + 8, z + TRAY_H + 13, 28, P, 0.4), { tone: "lo" }));

  // Indicator Needle / Pointer on master dial
  const dialCenter = at([dialX, dialY, z + TRAY_H + 13.1]);
  const dialTip = at([dialX + 8, dialY - 5, z + TRAY_H + 13.1]);
  out.push(`<line x1="${dialCenter[0].toFixed(1)}" y1="${dialCenter[1].toFixed(1)}" x2="${dialTip[0].toFixed(1)}" y2="${dialTip[1].toFixed(1)}" stroke="#34d399" stroke-width="2.0" stroke-linecap="round" />`);
  out.push(D([dialCenter], { size: 0.8, tone: "lit" }));

  // Corner Screws on the Faceplate
  const screws = k.corners(k.insetPlan(TRAY, 6));
  out.push(D(screws.map(([x, y]) => at([x, y, z + TRAY_H])), { size: 0.5, tone: "lo" }));

  return `<g class="iso-layer" data-layer="5" style="cursor: pointer;">${out.join("")}</g>`;
}

// Generate the complete interactive SVG
export function generateExplodedSvg() {
  const parts = [];

  // 1. Static base feet & full-length vertical guide tie-rods
  parts.push(buildBaseStand());
  parts.push(buildGuideRods());

  // 2. The 5 layers, painted bottom-to-top (painter's order)
  // Each layer is placed in its own group with a transform hook for live exploded separation
  parts.push(`<g id="layer-group-1" class="iso-anim-group" data-base-z="${LAYER_OFFSETS[0]}">${buildLayer1(0)}</g>`);
  parts.push(`<g id="layer-group-2" class="iso-anim-group" data-base-z="${LAYER_OFFSETS[1]}">${buildLayer2(0)}</g>`);
  parts.push(`<g id="layer-group-3" class="iso-anim-group" data-base-z="${LAYER_OFFSETS[2]}">${buildLayer3(0)}</g>`);
  parts.push(`<g id="layer-group-4" class="iso-anim-group" data-base-z="${LAYER_OFFSETS[3]}">${buildLayer4(0)}</g>`);
  parts.push(`<g id="layer-group-5" class="iso-anim-group" data-base-z="${LAYER_OFFSETS[4]}">${buildLayer5(0)}</g>`);

  return k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: "Cloakwire Exploded Architectural Stack",
    body: parts.join(""),
    standalone: false
  });
}

// Client-side script for interactive explosion physics, slider, layer selection, and wave oscillation
const CLIENT_SCRIPT = `
(function() {
  const svg = document.querySelector('.iso-svg');
  if (!svg) return;

  const root = svg.closest('.iso-figure') || document.body;
  const readout = root.querySelector('[data-readout]');
  const layerGroups = [
    document.getElementById('layer-group-1'),
    document.getElementById('layer-group-2'),
    document.getElementById('layer-group-3'),
    document.getElementById('layer-group-4'),
    document.getElementById('layer-group-5')
  ];

  const LAYER_OFFSETS = [0, 62, 124, 186, 248];
  const LAYER_INFOS = [
    { num: 1, tag: "L1: PHYSICAL NIC", title: "10 GbE PCIe · Gateway 192.168.1.1" },
    { num: 2, tag: "L2: WINTUN DRIVER", title: "Ring-buffer queue · Zero-copy FIFO" },
    { num: 3, tag: "L3: DUAL ROUTER", title: "sing-box engine + Xray fallback" },
    { num: 4, tag: "L4: CRYPTO VAULT", title: "VLESS Reality · XTLS-Vision flow" },
    { num: 5, tag: "L5: TAURI CONSOLE", title: "Rust IPC · 60 FPS Bento Canvas" }
  ];

  // Mathematically exact screen vertical projection per world unit of Z:
  // elevation = 26 deg, scale = ${P.scale}
  const Z_TO_DY = -Math.cos(26 * Math.PI / 180) * ${P.scale} * Math.sqrt(1.6);

  // Check URL query param for initial state (?assembled=1 or ?exploded=1)
  const params = new URLSearchParams(window.location.search);
  let explodeProgress = params.has('assembled') ? 0.0 : 1.0;
  let targetExplode = explodeProgress;
  let selectedLayer = 4; // default select Crypto Vault

  // Staggered spring state for each layer
  const layersState = [
    { currentZ: 0, targetZ: 0, v: 0 },
    { currentZ: 0, targetZ: 0, v: 0 },
    { currentZ: 0, targetZ: 0, v: 0 },
    { currentZ: 0, targetZ: 0, v: 0 },
    { currentZ: 0, targetZ: 0, v: 0 }
  ];

  function updateLayerTargets() {
    for (let i = 0; i < 5; i++) {
      layersState[i].targetZ = LAYER_OFFSETS[i] * explodeProgress;
    }
  }

  function updateReadout() {
    if (!readout) return;
    const info = LAYER_INFOS[selectedLayer - 1];
    readout.textContent = info.tag + " · " + info.title;
  }

  // Animation Loop
  let lastTime = performance.now();
  let wavePhase = 0;

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    wavePhase += dt * 8;

    // Follow target explode progress smoothly
    explodeProgress += (targetExplode - explodeProgress) * (1 - Math.exp(-dt / 0.18));
    updateLayerTargets();

    // Damped spring physics for each layer
    for (let i = 0; i < 5; i++) {
      const s = layersState[i];
      const diff = s.targetZ - s.currentZ;
      s.v += diff * 48 * dt;
      s.v *= Math.exp(-14 * dt);
      s.currentZ += s.v * dt;

      if (layerGroups[i]) {
        const dy = s.currentZ * Z_TO_DY;
        layerGroups[i].setAttribute("transform", "translate(0, " + dy.toFixed(2) + ")");
      }
    }

    // Animate wave on Level 5 screen
    const waveEl = svg.querySelector('.iso-wave-path');
    if (waveEl) {
      waveEl.style.strokeDashoffset = (wavePhase * 12).toFixed(1);
    }

    updateReadout();
    requestAnimationFrame(loop);
  }

  // Layer Click Selection
  function selectLayer(num) {
    selectedLayer = num;
    highlightLayer(num);
    updatePills(num);
    updateReadout();
  }

  svg.querySelectorAll('.iso-layer').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const num = parseInt(el.getAttribute('data-layer'), 10);
      if (!isNaN(num) && num >= 1 && num <= 5) {
        selectLayer(num);
      }
    });
  });

  function highlightLayer(num) {
    svg.querySelectorAll('.iso-layer').forEach(el => {
      const lNum = parseInt(el.getAttribute('data-layer'), 10);
      if (lNum === num) {
        el.style.filter = "drop-shadow(0 0 12px rgba(52, 211, 153, 0.85))";
      } else {
        el.style.filter = "none";
      }
    });
  }

  function updatePills(num) {
    document.querySelectorAll('[data-layer-btn]').forEach(btn => {
      const bNum = parseInt(btn.getAttribute('data-layer-btn'), 10);
      if (bNum === num) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Toolbar Actions
  const btnAssemble = document.querySelector('[data-action="assemble"]');
  const btnExplode = document.querySelector('[data-action="explode"]');
  if (btnAssemble) btnAssemble.addEventListener('click', () => { targetExplode = 0.0; });
  if (btnExplode) btnExplode.addEventListener('click', () => { targetExplode = 1.0; });

  document.querySelectorAll('[data-layer-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const num = parseInt(btn.getAttribute('data-layer-btn'), 10);
      if (!isNaN(num)) selectLayer(num);
    });
  });

  // Click background to toggle explode
  svg.addEventListener('click', (e) => {
    if (e.target.closest('.iso-layer')) return;
    targetExplode = targetExplode > 0.5 ? 0.0 : 1.0;
  });

  // Keyboard navigation
  root.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      targetExplode = targetExplode > 0.5 ? 0.0 : 1.0;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectLayer(Math.min(5, selectedLayer + 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectLayer(Math.max(1, selectedLayer - 1));
    }
  });

  // Initial setup
  selectLayer(selectedLayer);
  updateLayerTargets();
  requestAnimationFrame(loop);
})();
`;

// Build standalone HTML page
export function buildExplodedPage() {
  const svg = generateExplodedSvg();

  const toolbarHtml = `
    <div class="iso-exploded-controls">
      <div class="iso-btn-group">
        <button type="button" class="iso-btn" data-action="assemble">⚡ Assemble</button>
        <button type="button" class="iso-btn" data-action="explode">💥 Explode</button>
      </div>
      <div class="iso-pills-group">
        <button type="button" class="iso-pill" data-layer-btn="1">L1: NIC</button>
        <button type="button" class="iso-pill" data-layer-btn="2">L2: Wintun</button>
        <button type="button" class="iso-pill" data-layer-btn="3">L3: Router</button>
        <button type="button" class="iso-pill" data-layer-btn="4">L4: Crypto</button>
        <button type="button" class="iso-pill" data-layer-btn="5">L5: Console</button>
      </div>
    </div>
  `;

  const body = `
    ${toolbarHtml}
    ${k.plateHtml({
      fig: "Fig 2.0",
      title: "EXPLODED COMPONENT STACK",
      hint: "Click layer to inspect · Space to explode/assemble",
      readout: "L4: CRYPTO VAULT · VLESS Reality XTLS-Vision",
      keys: [
        { mark: "green", label: "Active cipher paths / Wave signal" },
        { mark: "lit", label: "Vertical tie rods / Machined trays" },
        { mark: "mid", label: "Processing engines (sing-box + Xray)" }
      ],
      caption: "Kinematic 5-tier exploded assembly of Cloakwire's client pipeline: from physical Ethernet adapter (L1) through kernel Wintun buffer (L2), dual routing dispatcher (L3), and cryptographic vault (L4) up to the Linear Bento console deck (L5).",
      body: `<div class="iso-cloakwire-card"><div class="iso-stage" tabindex="0">${svg}</div></div>`
    })}
  `;

  const customCss = `
    .iso-exploded-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding: 10px 18px;
      background: rgba(18, 19, 26, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      backdrop-filter: blur(12px);
    }
    .iso-btn-group, .iso-pills-group {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .iso-btn, .iso-pill {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      padding: 6px 14px;
      font-size: 12px;
      font-family: ui-monospace, "SF Mono", monospace;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .iso-btn:hover, .iso-pill:hover {
      background: rgba(52, 211, 153, 0.15);
      border-color: rgba(52, 211, 153, 0.4);
      color: #fff;
    }
    .iso-pill.active {
      background: rgba(52, 211, 153, 0.22);
      border-color: #34d399;
      color: #34d399;
      font-weight: 600;
    }
    .iso-plate-corner {
      white-space: nowrap;
      user-select: none;
    }
    @media (max-width: 640px) {
      .iso-plate-corner[data-corner="title"] { display: none !important; }
      .iso-plate-corner[data-corner="hint"] { display: none !important; }
      .iso-plate-corner[data-corner="readout"] { font-size: 11px; }
    }
  `;

  return k.pageHtml({
    title: "Cloakwire — Exploded Component Architecture",
    theme: "dark",
    width: 860,
    body: `<style>${customCss}</style>${body}`,
    script: CLIENT_SCRIPT
  });
}

const HERE = dirname(fileURLToPath(import.meta.url));
const docsDir = join(HERE, "..", "docs");
mkdirSync(docsDir, { recursive: true });

const html = buildExplodedPage();
writeFileSync(join(docsDir, "architecture-exploded.html"), html, "utf8");
console.log("Successfully generated docs/architecture-exploded.html");

