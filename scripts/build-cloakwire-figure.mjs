import { writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KIT_URL = "file:///C:/Users/%D0%90%D0%BB%D0%B5%D0%BA%D1%81%D0%B5%D0%B9/.gemini/config/skills/anatomy/kit/iso-kit.mjs";
const k = await import(KIT_URL);

// Instrument Layout
const WIDTH = 680;
const HEIGHT = 440;

const PLATE = { x: -140, y: -80, w: 280, d: 160, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

// Power knife switch
const PWR_X = -92;
const PWR_Y = -15;

// Rotary protocol selector knob
const KNOB_X = -20;
const KNOB_Y = 10;
const KNOB_R = 26;

// Split tunneling rail
const RAIL_FROM = 30;
const RAIL_TO = 120;
const RAIL_Y1 = -22;
const RAIL_Y2 = -4;
const CARRIAGE_W = 20;
const CARRIAGE_D = 28;
const STOPS = [42, 75, 108]; // DIRECT, SPLIT, GLOBAL

// Latency analog dial indicator
const DIAL = [75, 42];
const DIAL_R = 30;
const DIAL_Z = 12;
const DIAL_H = 14;
const DIAL_TOP = DIAL_Z + DIAL_H;
const POST = [42, 54];
const POST_TOP = DIAL_TOP + 8;

const P = k.fitProjection(
  [
    [PLATE.x - 14, PLATE.y - 14, -PLATE_H - FOOT_H],
    [PLATE.x + PLATE.w + 14, PLATE.y + PLATE.d + 14, 0],
    [POST[0], POST[1], POST_TOP + 4],
    [DIAL[0] + DIAL_R + 6, DIAL[1] + DIAL_R + 6, DIAL_TOP + 6],
    [PWR_X - 15, PWR_Y - 15, 45],
    [KNOB_X - KNOB_R, KNOB_Y - KNOB_R, 30]
  ],
  WIDTH,
  HEIGHT,
  { pad: 28, azimuth: 44, elevation: 32 }
);

const at = (pt) => k.iso(pt, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

function buildPlate() {
  const out = [];
  // Shadow halo
  out.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`);

  // Rubber feet on cylindrical risers
  for (const [x, y] of byDepth(k.corners(PLATE, 20))) {
    out.push(S(k.cylinder(x, y, 7.5, -PLATE_H - FOOT_H, 2, P, 24), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.8, -PLATE_H - FOOT_H + 2, FOOT_H - 2, P, 24), { tone: "mid" }));
  }

  // Solid base slab
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.5), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));

  // Corner hex mounting screws
  const screws = k.corners(PLATE, 9);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.5, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.6 }));

  // Engraved metal nameplate
  const tag = { x: -75, y: -72, w: 150, d: 14, r: 2 };
  out.push(S(k.slabOf(tag, 0, 0.8, P, 2, 0.2), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(tag, 0.8, P), { tone: "mid" }));
  const tagScrews = [
    [tag.x + 4, tag.y + tag.d / 2, 0.8],
    [tag.x + tag.w - 4, tag.y + tag.d / 2, 0.8]
  ];
  out.push(D(tagScrews.map(pt => at(pt)), { size: 0.5 }));

  // Nameplate text in isometric plane
  const tagCenter = [tag.x + tag.w / 2, tag.y + tag.d / 2 + 1, 0.8];
  const tagPt = at(tagCenter);
  out.push(`<text x="${tagPt[0].toFixed(1)}" y="${tagPt[1].toFixed(1)}" class="iso-face-text" data-tone="hi" font-size="7.5" font-weight="bold" text-anchor="middle">CLOAKWIRE DUAL-CORE CRYPTOGRAPHIC BENCH · UNIT 01</text>`);

  // Ruler tick strip along front edge
  const strip = { x: -130, y: PLATE.y + PLATE.d - 16, w: 260, d: 9, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 2), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 6, strip.x + strip.w - 6, 5, 5, strip.y + 1, 0.6, [2.5, 4.5], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));

  return out.join("");
}

function buildPowerUnit() {
  const out = [];
  // Power block housing
  const pwrBox = { x: PWR_X - 16, y: PWR_Y - 20, w: 32, d: 40, r: 3 };
  out.push(S(k.slabOf(pwrBox, 0, 10, P, 3, 0.6), { tone: "mid" }));
  out.push(L(k.planOutline(pwrBox, 10, P), { tone: "hi" }));

  // Bevel bezel for knife switch hinge
  out.push(S(k.cylinder(PWR_X, PWR_Y - 5, 8, 10, 4, P, 24), { tone: "hi" }));
  out.push(D([at([PWR_X, PWR_Y - 5, 14])], { size: 0.8 }));

  // Indicator LED socket
  out.push(S(k.cylinder(PWR_X, PWR_Y + 12, 4.5, 10, 2.5, P, 20), { tone: "lo" }));
  // LED jewel (lights up when connected)
  const ledPt = at([PWR_X, PWR_Y + 12, 12.5]);
  out.push(`<circle cx="${ledPt[0].toFixed(1)}" cy="${ledPt[1].toFixed(1)}" r="3" class="iso-led-glow" fill="#34d399" style="filter: drop-shadow(0 0 6px #10b981); transition: all 0.3s;" />`);

  // Switch label
  const pwrLabelPt = at([PWR_X, PWR_Y - 24, 0]);
  out.push(`<text x="${pwrLabelPt[0].toFixed(1)}" y="${pwrLabelPt[1].toFixed(1)}" class="iso-face-text" data-tone="mid" font-size="7" font-weight="600" text-anchor="middle">POWER / TUNNEL</text>`);

  return `<g data-part="power-unit" class="iso-clickable" style="cursor: pointer;">${out.join("")}</g>`;
}

function buildPowerLever(active = false) {
  // Lever arm that flips between OFF (leaning back) and ON (thrown forward)
  const angle = active ? 25 : -25;
  const rad = (angle * Math.PI) / 180;
  const len = 28;
  const zBase = 12;
  const xEnd = PWR_X + len * Math.sin(rad) * 0.4;
  const yEnd = PWR_Y - 5 + len * Math.sin(rad);
  const zEnd = zBase + len * Math.cos(rad);

  const out = [];
  // Pivot pin
  out.push(S(k.cylinder(PWR_X, PWR_Y - 5, 2.8, 10, 5, P, 16), { tone: "lo" }));
  // Lever rod
  const p0 = at([PWR_X, PWR_Y - 5, zBase]);
  const p1 = at([xEnd, yEnd, zEnd]);
  out.push(`<line x1="${p0[0].toFixed(1)}" y1="${p0[1].toFixed(1)}" x2="${p1[0].toFixed(1)}" y2="${p1[1].toFixed(1)}" stroke="var(--anatomy-hi)" stroke-width="3" stroke-linecap="round" />`);
  // Knurled knob handle
  const knobCenter = at([xEnd, yEnd, zEnd]);
  out.push(`<circle cx="${knobCenter[0].toFixed(1)}" cy="${knobCenter[1].toFixed(1)}" r="4.5" fill="var(--anatomy-strong)" stroke="var(--anatomy-lit)" stroke-width="1.2" />`);

  return `<g data-part="power-lever" class="iso-clickable" style="cursor: pointer;">${out.join("")}</g>`;
}

function buildProtocolSelector() {
  const out = [];
  // Raised round base
  out.push(S(k.cylinder(KNOB_X, KNOB_Y, KNOB_R + 5, 0, 4, P, 32), { tone: "mid" }));
  out.push(L(k.ring(KNOB_X, KNOB_Y, KNOB_R + 5, 4, P, 32), { tone: "hi" }));

  // 4 detent ticks and labels for protocols
  const protocols = [
    { name: "VLESS", angle: -135 },
    { name: "HY2", angle: -45 },
    { name: "TUIC", angle: 45 },
    { name: "WG", angle: 135 }
  ];

  for (const proto of protocols) {
    const rad = (proto.angle * Math.PI) / 180;
    const rTick1 = KNOB_R + 1.5;
    const rTick2 = KNOB_R + 4.5;
    const rText = KNOB_R + 9;
    const t0 = at([KNOB_X + rTick1 * Math.cos(rad), KNOB_Y + rTick1 * Math.sin(rad), 4]);
    const t1 = at([KNOB_X + rTick2 * Math.cos(rad), KNOB_Y + rTick2 * Math.sin(rad), 4]);
    out.push(`<line x1="${t0[0].toFixed(1)}" y1="${t0[1].toFixed(1)}" x2="${t1[0].toFixed(1)}" y2="${t1[1].toFixed(1)}" stroke="var(--anatomy-hi)" stroke-width="1.2" stroke-linecap="round" />`);

    const txtPt = at([KNOB_X + rText * Math.cos(rad), KNOB_Y + rText * Math.sin(rad), 4]);
    out.push(`<text x="${txtPt[0].toFixed(1)}" y="${(txtPt[1] + 2.5).toFixed(1)}" class="iso-face-text" data-tone="mid" font-size="6.5" font-weight="bold" text-anchor="middle">${proto.name}</text>`);
  }

  // Knurled rotary knob
  const knobBody = [];
  knobBody.push(S(k.cylinder(KNOB_X, KNOB_Y, KNOB_R - 2, 4, 12, P, 32), { tone: "hi" }));
  knobBody.push(L(k.ring(KNOB_X, KNOB_Y, KNOB_R - 2, 16, P, 32), { tone: "lit" }));
  knobBody.push(L(k.ring(KNOB_X, KNOB_Y, KNOB_R - 4, 16, P, 32), { tone: "mid" }));
  out.push(`<g data-part="protocol-knob" class="iso-clickable" style="cursor: pointer;">${knobBody.join("")}</g>`);

  // Protocol knob label
  const labelPt = at([KNOB_X, KNOB_Y - KNOB_R - 9, 0]);
  out.push(`<text x="${labelPt[0].toFixed(1)}" y="${labelPt[1].toFixed(1)}" class="iso-face-text" data-tone="mid" font-size="7" font-weight="600" text-anchor="middle">PROTOCOL SELECTOR</text>`);

  return out.join("");
}

function buildKnobPointer(angleDeg = -135) {
  // Arrow / line on top of the knob showing selected protocol
  const rad = (angleDeg * Math.PI) / 180;
  const pCenter = at([KNOB_X, KNOB_Y, 16.2]);
  const pEdge = at([KNOB_X + (KNOB_R - 5) * Math.cos(rad), KNOB_Y + (KNOB_R - 5) * Math.sin(rad), 16.2]);
  const out = [
    `<line x1="${pCenter[0].toFixed(1)}" y1="${pCenter[1].toFixed(1)}" x2="${pEdge[0].toFixed(1)}" y2="${pEdge[1].toFixed(1)}" stroke="#34d399" stroke-width="2.2" stroke-linecap="round" />`,
    `<circle cx="${pCenter[0].toFixed(1)}" cy="${pCenter[1].toFixed(1)}" r="2" fill="var(--anatomy-lit)" />`
  ];
  return `<g data-part="knob-pointer" class="iso-clickable" style="cursor: pointer;">${out.join("")}</g>`;
}

function buildSplitRails() {
  const out = [];
  // Twin guide rails
  for (const y of [RAIL_Y1, RAIL_Y2]) {
    // End stops / pill blocks
    out.push(S(k.slabOf({ x: RAIL_FROM - 4, y: y - 3, w: 6, d: 6, r: 1 }, 0, 5, P, 1), { tone: "mid" }));
    out.push(S(k.slabOf({ x: RAIL_TO - 2, y: y - 3, w: 6, d: 6, r: 1 }, 0, 5, P, 1), { tone: "mid" }));
    // Rail rod
    out.push(S(k.slabOf({ x: RAIL_FROM, y: y - 1.5, w: RAIL_TO - RAIL_FROM, d: 3, r: 1 }, 2, 3, P, 1), { tone: "hi" }));
  }

  // Routing track position markers
  const modes = [
    { name: "DIRECT", x: STOPS[0] },
    { name: "SPLIT", x: STOPS[1] },
    { name: "GLOBAL", x: STOPS[2] }
  ];

  for (let idx = 0; idx < modes.length; idx++) {
    const m = modes[idx];
    const markPt = at([m.x, (RAIL_Y1 + RAIL_Y2) / 2, 0.4]);
    const txtPt = at([m.x, RAIL_Y2 + 9, 0]);
    out.push(`<g data-part="mode-stop" data-mode-idx="${idx}" class="iso-clickable" style="cursor: pointer;">`);
    out.push(D([markPt], { size: 0.8 }));
    out.push(`<text x="${txtPt[0].toFixed(1)}" y="${txtPt[1].toFixed(1)}" class="iso-face-text" data-tone="mid" font-size="6" font-weight="bold" text-anchor="middle">${m.name}</text>`);
    out.push(`</g>`);
  }

  // Label
  const railLabel = at([(RAIL_FROM + RAIL_TO) / 2, RAIL_Y1 - 9, 0]);
  out.push(`<text x="${railLabel[0].toFixed(1)}" y="${railLabel[1].toFixed(1)}" class="iso-face-text" data-tone="mid" font-size="7" font-weight="600" text-anchor="middle">ROUTING MODE (SPLIT TUNNEL)</text>`);

  return out.join("");
}

function buildCarriage() {
  const out = [];
  // Sliding carriage block
  const cBox = { x: -CARRIAGE_W / 2, y: -CARRIAGE_D / 2, w: CARRIAGE_W, d: CARRIAGE_D, r: 3 };
  out.push(S(k.slabOf(cBox, 3, 10, P, 3, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(cBox, 13, P), { tone: "hi" }));

  // Sleeve bushings on rails
  out.push(S(k.cylinder(-CARRIAGE_W / 2 + 6, -CARRIAGE_D / 2 + 10, 4, 2, 8, P, 16), { tone: "lo" }));
  out.push(S(k.cylinder(CARRIAGE_W / 2 - 6, -CARRIAGE_D / 2 + 10, 4, 2, 8, P, 16), { tone: "lo" }));
  out.push(S(k.cylinder(-CARRIAGE_W / 2 + 6, CARRIAGE_D / 2 - 10, 4, 2, 8, P, 16), { tone: "lo" }));
  out.push(S(k.cylinder(CARRIAGE_W / 2 - 6, CARRIAGE_D / 2 - 10, 4, 2, 8, P, 16), { tone: "lo" }));

  // Lock thumb screw on top
  out.push(S(k.cylinder(0, 0, 7, 13, 6, P, 24), { tone: "hi" }));
  out.push(L(k.ring(0, 0, 7, 19, P, 24), { tone: "lit" }));
  out.push(D([at([0, 0, 19.2])], { size: 0.9 }));

  // Pointer triangle
  const tip0 = at([0, CARRIAGE_D / 2 + 2, 4]);
  const tip1 = at([-3, CARRIAGE_D / 2 - 2, 4]);
  const tip2 = at([3, CARRIAGE_D / 2 - 2, 4]);
  out.push(`<polygon points="${tip0[0]},${tip0[1]} ${tip1[0]},${tip1[1]} ${tip2[0]},${tip2[1]}" fill="#34d399" />`);

  return `<g data-part="carriage" class="iso-draggable" style="cursor: grab;">${out.join("")}</g>`;
}

function buildLatencyDial() {
  const out = [];
  // Rear mounting vertical stanchion post
  out.push(S(k.cylinder(POST[0], POST[1], 5, 0, POST_TOP, P, 24), { tone: "mid" }));
  out.push(L(k.ring(POST[0], POST[1], 5, POST_TOP, P, 24), { tone: "hi" }));

  // Clamp collar arm holding the dial housing
  const arm = { x: DIAL[0] - 6, y: POST[1] - 3, w: 12, d: DIAL[1] - POST[1] + 6, r: 2 };
  out.push(S(k.slabOf(arm, DIAL_Z - 3, 6, P, 2, 0.4), { tone: "hi" }));
  out.push(D([at([POST[0], POST[1], DIAL_Z + 3])], { size: 0.8 }));

  // Outer circular dial housing
  out.push(S(k.cylinder(DIAL[0], DIAL[1], DIAL_R, DIAL_Z, DIAL_H, P, 36), { tone: "mid" }));
  out.push(L(k.ring(DIAL[0], DIAL[1], DIAL_R, DIAL_TOP, P, 36), { tone: "lit" }));

  // Recessed dial face
  out.push(S(k.cylinder(DIAL[0], DIAL[1], DIAL_R - 2.5, DIAL_TOP - 1, 1, P, 36), { tone: "lo" }));
  out.push(L(k.ring(DIAL[0], DIAL[1], DIAL_R - 2.5, DIAL_TOP, P, 36), { tone: "mid" }));

  // Circular tick marks around dial face (0 to 100 ms)
  const dialTicks = k.radialTicks(DIAL[0], DIAL[1], DIAL_R - 4, 30, 5, DIAL_TOP, [1.5, 3.5], P, -Math.PI * 0.75, Math.PI * 1.5);
  out.push(L(dialTicks.minor, { tone: "mid" }));
  out.push(L(dialTicks.major, { tone: "hi" }));

  // Face text: LATENCY (MS)
  const faceTitle = at([DIAL[0], DIAL[1] - 8, DIAL_TOP]);
  out.push(`<text x="${faceTitle[0].toFixed(1)}" y="${faceTitle[1].toFixed(1)}" class="iso-face-text" data-tone="hi" font-size="6" font-weight="bold" text-anchor="middle">LATENCY</text>`);
  const faceSub = at([DIAL[0], DIAL[1] + 10, DIAL_TOP]);
  out.push(`<text x="${faceSub[0].toFixed(1)}" y="${faceSub[1].toFixed(1)}" class="iso-face-text" data-tone="mid" font-size="5" text-anchor="middle">0 - 100 MS</text>`);

  // Lower plunger stem extending downwards
  out.push(S(k.cylinder(DIAL[0], DIAL[1] + DIAL_R - 3, 2.5, 0, DIAL_Z, P, 16), { tone: "hi" }));

  return out.join("");
}

function buildDialNeedle(ms = 24) {
  // Needle pointing to current ping (0 to 100 ms maps to -135deg to +135deg)
  const angleDeg = -135 + (Math.min(100, Math.max(0, ms)) / 100) * 270;
  const rad = (angleDeg * Math.PI) / 180;
  const pCenter = at([DIAL[0], DIAL[1], DIAL_TOP + 0.5]);
  const pTip = at([
    DIAL[0] + (DIAL_R - 6) * Math.sin(rad),
    DIAL[1] - (DIAL_R - 6) * Math.cos(rad),
    DIAL_TOP + 0.5
  ]);
  const pTail = at([
    DIAL[0] - 5 * Math.sin(rad),
    DIAL[1] + 5 * Math.cos(rad),
    DIAL_TOP + 0.5
  ]);

  const out = [
    `<line x1="${pTail[0].toFixed(1)}" y1="${pTail[1].toFixed(1)}" x2="${pTip[0].toFixed(1)}" y2="${pTip[1].toFixed(1)}" stroke="#34d399" stroke-width="1.8" stroke-linecap="round" />`,
    `<circle cx="${pCenter[0].toFixed(1)}" cy="${pCenter[1].toFixed(1)}" r="2.8" fill="var(--anatomy-lit)" stroke="var(--anatomy-strong)" stroke-width="0.8" />`
  ];
  return `<g data-part="dial-needle">${out.join("")}</g>`;
}

const STANDALONE_SVG_STYLE = `
  :root {
    --anatomy-page:#0b0b0b;--anatomy-card:#131313;--anatomy-text:#a3a3a3;--anatomy-strong:#e6e6e6;--anatomy-muted:#6e6e6e;
    --anatomy-paper:#14151a;--anatomy-face:#1c1d24;--anatomy-top:#22242c;
    --anatomy-shade-0:#0d0e12;--anatomy-shade-1:#121318;--anatomy-shade-2:#171820;--anatomy-shade-3:#1c1d26;
    --anatomy-lit-top:#2a2d38;--anatomy-lit-shade:#20222a;
    --anatomy-hi:#e2e8f0;--anatomy-mid:#94a3b8;--anatomy-lo:#475569;--anatomy-faint:#334155;--anatomy-lit:#ffffff;
    --anatomy-halo:#050505;--anatomy-halo-opacity:.9;--anatomy-dot:#e6e6e6;
    --anatomy-weight:.75px;
    --anatomy-mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  }
  .iso-svg{display:block;width:100%;height:auto;overflow:visible;background:#090a0f;font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace}
  .iso-svg path,.iso-svg circle{vector-effect:non-scaling-stroke}
  .iso-fill{fill:var(--anatomy-paper);stroke:none}
  .iso-solid[data-lit]>.iso-fill{fill:var(--anatomy-face)}
  .iso-shade,.iso-top{stroke:none}
  .iso-shade[data-shade="0"]{fill:var(--anatomy-shade-0)}
  .iso-shade[data-shade="1"]{fill:var(--anatomy-shade-1)}
  .iso-shade[data-shade="2"]{fill:var(--anatomy-shade-2)}
  .iso-shade[data-shade="3"]{fill:var(--anatomy-shade-3)}
  .iso-top{fill:var(--anatomy-top)}
  .iso-solid[data-lit]>.iso-top{fill:var(--anatomy-lit-top)}
  .iso-solid[data-lit]>.iso-shade{fill:var(--anatomy-lit-shade)}
  .iso-solid[data-seamless]>.iso-shade,.iso-solid[data-seamless]>.iso-top{stroke-width:.4;stroke-linejoin:round}
  .iso-solid[data-lit]>.iso-edge{stroke:var(--anatomy-lit)}
  .iso-halo{fill:var(--anatomy-halo);stroke:none;filter:blur(9px);opacity:var(--anatomy-halo-opacity);transform:translateY(3px)}
  .iso-line{fill:none;stroke:var(--anatomy-lo);stroke-width:var(--anatomy-weight);stroke-linecap:round;stroke-linejoin:round}
  .iso-line[data-tone="hi"]{stroke:var(--anatomy-hi)}
  .iso-line[data-tone="mid"]{stroke:var(--anatomy-mid)}
  .iso-line[data-tone="lo"]{stroke:var(--anatomy-lo)}
  .iso-line[data-tone="faint"]{stroke:var(--anatomy-faint)}
  .iso-line[data-tone="lit"]{stroke:var(--anatomy-lit)}
  .iso-dots circle{fill:var(--anatomy-dot);stroke:none;opacity:.45}
  .iso-dots[data-tone="hi"] circle{opacity:.85}
  .iso-dots[data-tone="mid"] circle{opacity:.55}
  .iso-dots[data-tone="lo"] circle{opacity:.3}
  .iso-dots[data-tone="faint"] circle{opacity:.15}
  .iso-face-text{fill:var(--anatomy-mid);font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;letter-spacing:.04em}
  .iso-face-text[data-tone="hi"]{fill:var(--anatomy-hi)}
  .iso-face-text[data-tone="lo"]{fill:var(--anatomy-lo)}
`;

export function generateFigureSvg({ standalone = false } = {}) {
  const parts = [
    buildPlate(),
    buildPowerUnit(),
    buildPowerLever(false),
    buildProtocolSelector(),
    buildKnobPointer(-135),
    buildSplitRails(),
    `<g data-part="carriage-group" transform="${k.translateAlong(P, [STOPS[1], (RAIL_Y1 + RAIL_Y2) / 2, 0])}">${buildCarriage()}</g>`,
    buildLatencyDial(),
    buildDialNeedle(24)
  ];

  return `<svg class="iso-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cloakwire Cryptographic Bench Instrument">
    <defs>
      ${standalone ? `<style>${STANDALONE_SVG_STYLE}</style>` : ""}
      <filter id="cloakwire-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    ${standalone ? `<rect width="100%" height="100%" rx="16" fill="#090a0f" />` : ""}
    ${parts.join("\n")}
  </svg>`;
}

// Client runtime script for real-time interaction
export const CLIENT_SCRIPT = `
(function() {
  const root = document.querySelector('.iso-cloakwire-card') || document;
  const svg = root.querySelector('.iso-svg');
  if (!svg) return;

  const lever = svg.querySelector('[data-part="power-lever"]');
  const powerUnit = svg.querySelector('[data-part="power-unit"]');
  const pointer = svg.querySelector('[data-part="knob-pointer"]');
  const knobBase = svg.querySelector('[data-part="protocol-knob"]');
  const carriageGroup = svg.querySelector('[data-part="carriage-group"]');
  const needleGroup = svg.querySelector('[data-part="dial-needle"]');
  const led = svg.querySelector('.iso-led-glow');
  const readout = root.querySelector('[data-readout]');

  // Projection constants
  const P = ${JSON.stringify(P)};
  const STOPS = ${JSON.stringify(STOPS)};
  const RAIL_Y = ${(RAIL_Y1 + RAIL_Y2) / 2};
  const DIAL_CENTER = [${DIAL[0]}, ${DIAL[1]}];
  const DIAL_R = ${DIAL_R};
  const DIAL_TOP = ${DIAL_TOP};
  const KNOB_X = ${KNOB_X};
  const KNOB_Y = ${KNOB_Y};
  const KNOB_R = ${KNOB_R};
  const PWR_X = ${PWR_X};
  const PWR_Y = ${PWR_Y};

  const PROTOCOLS = [
    { name: "VLESS Reality", cipher: "XTLS-Vision · ChaCha20", ping: 22, angle: -135 },
    { name: "Hysteria 2", cipher: "Salamander · BBR Congestion", ping: 31, angle: -45 },
    { name: "TUIC v5", cipher: "QUIC 0-RTT · BBR", ping: 28, angle: 45 },
    { name: "WireGuard", cipher: "Noise_IK · Poly1305", ping: 19, angle: 135 }
  ];

  const MODES = ["DIRECT BYPASS", "SPLIT ROUTING", "GLOBAL TUNNEL"];

  // State
  let powerOn = true;
  let protoIdx = 0;
  let modeIdx = 1; // SPLIT
  let carriageX = STOPS[1];
  let targetCarriageX = STOPS[1];
  let currentPing = 22;
  let targetPing = 22;
  let throughputMB = 14.8;
  let animFrame = null;

  function iso(pt) {
    const a = P.azimuth * (Math.PI / 180);
    const e = P.elevation * (Math.PI / 180);
    const sinA = Math.sin(a), cosA = Math.cos(a), sinE = Math.sin(e), cosE = Math.cos(e);
    const k = P.scale * Math.sqrt(1.6);
    return [
      P.origin[0] + (pt[0] * sinA - pt[1] * cosA) * k,
      P.origin[1] + ((pt[0] * cosA + pt[1] * sinA) * sinE - pt[2] * cosE) * k
    ];
  }

  function updateReadout() {
    if (!readout) return;
    const proto = PROTOCOLS[protoIdx];
    const mode = MODES[modeIdx];
    if (powerOn) {
      readout.textContent = proto.name + " · " + mode + " · " + Math.round(currentPing) + " ms · " + throughputMB.toFixed(1) + " MB/s";
    } else {
      readout.textContent = "TUNNEL INACTIVE · STANDBY";
    }
  }

  function updatePowerVisual() {
    if (!lever) return;
    const angle = powerOn ? 25 : -25;
    const rad = (angle * Math.PI) / 180;
    const len = 28;
    const zBase = 12;
    const xEnd = PWR_X + len * Math.sin(rad) * 0.4;
    const yEnd = PWR_Y - 5 + len * Math.sin(rad);
    const zEnd = zBase + len * Math.cos(rad);

    const p0 = iso([PWR_X, PWR_Y - 5, zBase]);
    const p1 = iso([xEnd, yEnd, zEnd]);
    lever.innerHTML = '<line x1="' + p0[0].toFixed(1) + '" y1="' + p0[1].toFixed(1) + '" x2="' + p1[0].toFixed(1) + '" y2="' + p1[1].toFixed(1) + '" stroke="var(--anatomy-hi)" stroke-width="3" stroke-linecap="round" />' +
      '<circle cx="' + p1[0].toFixed(1) + '" cy="' + p1[1].toFixed(1) + '" r="4.5" fill="var(--anatomy-strong)" stroke="var(--anatomy-lit)" stroke-width="1.2" />';

    if (led) {
      led.setAttribute("fill", powerOn ? "#34d399" : "#4b5563");
      led.style.filter = powerOn ? "drop-shadow(0 0 6px #10b981)" : "none";
    }
  }

  function updateKnobVisual() {
    if (!pointer) return;
    const proto = PROTOCOLS[protoIdx];
    const rad = (proto.angle * Math.PI) / 180;
    const pCenter = iso([KNOB_X, KNOB_Y, 16.2]);
    const pEdge = iso([KNOB_X + (KNOB_R - 5) * Math.cos(rad), KNOB_Y + (KNOB_R - 5) * Math.sin(rad), 16.2]);
    pointer.innerHTML = '<line x1="' + pCenter[0].toFixed(1) + '" y1="' + pCenter[1].toFixed(1) + '" x2="' + pEdge[0].toFixed(1) + '" y2="' + pEdge[1].toFixed(1) + '" stroke="#34d399" stroke-width="2.2" stroke-linecap="round" />' +
      '<circle cx="' + pCenter[0].toFixed(1) + '" cy="' + pCenter[1].toFixed(1) + '" r="2" fill="var(--anatomy-lit)" />';
  }

  function updateNeedleVisual() {
    if (!needleGroup) return;
    const ms = powerOn ? currentPing : 0;
    const angleDeg = -135 + (Math.min(100, Math.max(0, ms)) / 100) * 270;
    const rad = (angleDeg * Math.PI) / 180;
    const pCenter = iso([DIAL_CENTER[0], DIAL_CENTER[1], DIAL_TOP + 0.5]);
    const pTip = iso([
      DIAL_CENTER[0] + (DIAL_R - 6) * Math.sin(rad),
      DIAL_CENTER[1] - (DIAL_R - 6) * Math.cos(rad),
      DIAL_TOP + 0.5
    ]);
    const pTail = iso([
      DIAL_CENTER[0] - 5 * Math.sin(rad),
      DIAL_CENTER[1] + 5 * Math.cos(rad),
      DIAL_TOP + 0.5
    ]);
    needleGroup.innerHTML = '<line x1="' + pTail[0].toFixed(1) + '" y1="' + pTail[1].toFixed(1) + '" x2="' + pTip[0].toFixed(1) + '" y2="' + pTip[1].toFixed(1) + '" stroke="#34d399" stroke-width="1.8" stroke-linecap="round" />' +
      '<circle cx="' + pCenter[0].toFixed(1) + '" cy="' + pCenter[1].toFixed(1) + '" r="2.8" fill="var(--anatomy-lit)" stroke="var(--anatomy-strong)" stroke-width="0.8" />';
  }

  function updateCarriageVisual() {
    if (!carriageGroup) return;
    const a = P.azimuth * (Math.PI / 180);
    const e = P.elevation * (Math.PI / 180);
    const k = P.scale * Math.sqrt(1.6);
    const dx = (carriageX * Math.sin(a) - RAIL_Y * Math.cos(a)) * k;
    const dy = ((carriageX * Math.cos(a) + RAIL_Y * Math.sin(a)) * Math.sin(e)) * k;
    carriageGroup.setAttribute("transform", "translate(" + dx.toFixed(1) + ", " + dy.toFixed(1) + ")");
  }

  // Animation Loop with smooth physics
  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    // Smooth carriage interpolation
    carriageX += (targetCarriageX - carriageX) * (1 - Math.exp(-dt / 0.15));
    if (Math.abs(targetCarriageX - carriageX) < 0.1) carriageX = targetCarriageX;

    // Ping jitter / hum
    if (powerOn) {
      targetPing = PROTOCOLS[protoIdx].ping + (Math.sin(now / 400) * 2.5) + (Math.cos(now / 150) * 1.5);
      throughputMB = 12.5 + Math.sin(now / 600) * 3.2;
    } else {
      targetPing = 0;
      throughputMB = 0;
    }
    currentPing += (targetPing - currentPing) * (1 - Math.exp(-dt / 0.1));

    updateCarriageVisual();
    updateNeedleVisual();
    updateReadout();

    animFrame = requestAnimationFrame(loop);
  }

  // Interactivity handlers
  function togglePower(e) {
    if (e) e.stopPropagation();
    powerOn = !powerOn;
    updatePowerVisual();
  }
  if (lever) lever.addEventListener("click", togglePower);
  if (powerUnit) powerUnit.addEventListener("click", togglePower);

  function advanceProtocol(e) {
    if (e) e.stopPropagation();
    protoIdx = (protoIdx + 1) % PROTOCOLS.length;
    updateKnobVisual();
  }
  if (pointer) pointer.addEventListener("click", advanceProtocol);
  if (knobBase) knobBase.addEventListener("click", advanceProtocol);

  const modeStops = svg.querySelectorAll('[data-part="mode-stop"]');
  modeStops.forEach(stop => {
    stop.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(stop.getAttribute("data-mode-idx"), 10);
      if (!isNaN(idx) && idx >= 0 && idx < STOPS.length) {
        modeIdx = idx;
        targetCarriageX = STOPS[idx];
      }
    });
  });

  // Carriage dragging / click along rails
  svg.addEventListener("pointerdown", (e) => {
    if (e.target.closest('[data-part="power-lever"]') || 
        e.target.closest('[data-part="power-unit"]') || 
        e.target.closest('[data-part="knob-pointer"]') || 
        e.target.closest('[data-part="protocol-knob"]') ||
        e.target.closest('[data-part="mode-stop"]')) {
      return;
    }
    const rect = svg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (clickX / rect.width - 0.45) / 0.35));
    targetCarriageX = STOPS[0] + ratio * (STOPS[2] - STOPS[0]);
    let best = 0;
    let bestDist = Infinity;
    STOPS.forEach((stop, idx) => {
      const d = Math.abs(stop - targetCarriageX);
      if (d < bestDist) { bestDist = d; best = idx; }
    });
    modeIdx = best;
    targetCarriageX = STOPS[best];
  });

  // Initial render
  updatePowerVisual();
  updateKnobVisual();
  updateCarriageVisual();
  updateNeedleVisual();
  updateReadout();

  animFrame = requestAnimationFrame(loop);
})();
`;

// Build standalone HTML and embedded card
export function buildStandAloneHtml() {
  const svg = generateFigureSvg({ standalone: false });
  const body = k.plateHtml({
    fig: "Fig 1",
    title: "Cloakwire Cryptographic Unit",
    hint: "Click switch to toggle tunnel · Click knob to change protocol · Drag or click rails",
    readout: "VLESS Reality · SPLIT ROUTING · 24 ms · 14.8 MB/s",
    keys: [
      { mark: "green", label: "Active encrypted path / Live status indicator" },
      { mark: "lit", label: "Controls: Power knife-switch, protocol knob, split-tunneling carriage" },
      { mark: "mid", label: "Precision analog ping dial (0 - 100 ms)" }
    ],
    caption: "Cloakwire Dual-Core Hardware Gateway: interact with the mechanical switch, protocol rotary selector, and routing carriage to inspect tunnel status and latency in real time.",
    body: `<div class="iso-cloakwire-card"><div class="iso-stage" tabindex="0">${svg}</div></div>`
  });

  return k.pageHtml({
    title: "Cloakwire Cryptographic Unit",
    theme: "dark",
    body,
    script: CLIENT_SCRIPT
  });
}

// Generate files
const HERE = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(HERE, "..");
const docsDir = join(repoRoot, "docs");

// 1. Standalone preview HTML
const standaloneHtml = buildStandAloneHtml();
writeFileSync(join(docsDir, "cloakwire-figure.html"), standaloneHtml, "utf8");
console.log("Successfully generated docs/cloakwire-figure.html");

// 2. Standalone SVG asset (with embedded styles for GitHub/external embedding)
const svgStandalone = generateFigureSvg({ standalone: true });
writeFileSync(join(docsDir, "screenshots", "cloakwire-cryptographic-unit.svg"), svgStandalone, "utf8");
console.log("Successfully generated docs/screenshots/cloakwire-cryptographic-unit.svg");

// 3. Update docs/index.html with interactive unit and bump version to v1.4.6
export function patchLandingPage() {
  const indexPath = join(docsDir, "index.html");
  let content = readFileSync(indexPath, "utf8");

  // Bump version numbers
  content = content.replaceAll("1.4.2", "1.4.6");

  // Inject ISO styles into <head> if not already present
  if (!content.includes("/* ANATOMY_ISO_CSS */")) {
    const customIsoCss = `
    /* ANATOMY_ISO_CSS */
    ${k.ISO_CSS}
    .iso-plate {
      border-radius: 1rem;
      border: 1px solid rgba(52, 211, 153, 0.2);
      background: rgba(18, 19, 26, 0.7);
      backdrop-filter: blur(12px);
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
      padding: 44px 20px 32px;
    }
    .iso-stage { outline: none; }
    .iso-clickable, .iso-draggable { transition: filter 0.2s ease; }
    .iso-clickable:hover { filter: drop-shadow(0 0 6px rgba(52, 211, 153, 0.6)); }
    `;
    content = content.replace("</style>", `${customIsoCss}\n  </style>`);
  }

  // Ensure body has class "iso" and data-theme="dark"
  if (!content.includes('class="iso"')) {
    content = content.replace('<body class="', '<body class="iso ');
    content = content.replace('<body class="iso ', '<body data-theme="dark" class="iso ');
  }

  // Inject interactive section after hero showcase preview
  const figureSectionMarker = "<!-- Interactive Anatomy Architectural Unit Section -->";
  if (!content.includes(figureSectionMarker)) {
    const svgForLanding = generateFigureSvg({ standalone: false });
    const plateHtml = k.plateHtml({
      fig: "Fig 1.0",
      title: "Cloakwire Dual-Core Cryptographic Gateway",
      hint: "Click knife-switch to toggle tunnel · Click knob to select protocol · Click rails to shift mode",
      readout: "VLESS Reality · SPLIT ROUTING · 24 ms · 14.8 MB/s",
      keys: [
        { mark: "green", label: "Active encrypted path / Live status indicator" },
        { mark: "lit", label: "Controls: Knife-switch, rotary dial, split-tunneling carriage" },
        { mark: "mid", label: "Precision analog ping dial (0 - 100 ms)" }
      ],
      caption: "Interactive Architectural Model: test tunnel toggling, protocol switching, and mode routing on the dual-core hardware gateway simulation.",
      body: `<div class="iso-cloakwire-card"><div class="iso-stage" tabindex="0">${svgForLanding}</div></div>`
    });

    const sectionHtml = `
    ${figureSectionMarker}
    <section id="model" class="max-w-5xl mx-auto px-6 py-16 text-center border-t border-white/5">
      <div class="text-center max-w-2xl mx-auto mb-8">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-mono mb-3">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Interactive Architectural Model</span>
        </div>
        <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Under the Hood: Dual-Core Cryptographic Bench</h2>
        <p class="text-zinc-400 text-sm mt-2">
          An interactive isometric breakdown of Cloakwire's dual-engine routing architecture. Flip the knife-switch, rotate the protocol dial, and slide the split-tunneling carriage.
        </p>
      </div>

      <div class="max-w-4xl mx-auto text-left">
        ${plateHtml}
      </div>
    </section>
    `;

    const heroShowcaseEnd = '</div>\n    </section>';
    content = content.replace(heroShowcaseEnd, `</div>\n    </section>\n${sectionHtml}`);
  }

  // Inject client script before </body>
  const scriptMarker = "<!-- ANATOMY_CLIENT_SCRIPT -->";
  if (!content.includes(scriptMarker)) {
    const scriptBlock = `
  ${scriptMarker}
  <script type="module">
  ${CLIENT_SCRIPT}
  </script>
    `;
    content = content.replace("</body>", `${scriptBlock}\n</body>`);
  }

  // Also add nav link to #model in header
  if (!content.includes('href="#model"')) {
    content = content.replace(
      '<a href="#features" class="hover:text-white transition-colors">Features</a>',
      '<a href="#model" class="hover:text-white transition-colors">Architecture</a>\n        <a href="#features" class="hover:text-white transition-colors">Features</a>'
    );
  }

  writeFileSync(indexPath, content, "utf8");
  console.log("Successfully patched docs/index.html to v1.4.6 with interactive figure!");
}

patchLandingPage();
