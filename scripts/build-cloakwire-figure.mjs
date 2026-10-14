import { writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KIT_URL = "file:///C:/Users/%D0%90%D0%BB%D0%B5%D0%BA%D1%81%D0%B5%D0%B9/.gemini/config/skills/anatomy/kit/iso-kit.mjs";
const k = await import(KIT_URL);

// Instrument Layout
const WIDTH = 680;
const HEIGHT = 420;

// Base Plate: heavy precision surface plate
const PLATE = { x: -130, y: -65, w: 260, d: 130, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

// Station 1: Power Knife Switch (Left)
const PWR_X = -82;
const PWR_Y = 0;
const PWR_BOX = { x: PWR_X - 16, y: PWR_Y - 22, w: 32, d: 44, r: 3 };

// Station 2: Rotary Protocol Knob (Center-Left)
const KNOB_X = -28;
const KNOB_Y = 0;
const KNOB_R = 21;

// Station 3: Precision Analog Ping Dial (Center-Right)
const DIAL_X = 26;
const DIAL_Y = 0;
const DIAL_R = 22;
const DIAL_Z = 6;
const DIAL_H = 12;
const DIAL_TOP = DIAL_Z + DIAL_H;

// Station 4: Split Tunneling Rail & Carriage (Far-Right)
const RAIL_FROM = 62;
const RAIL_TO = 118;
const RAIL_Y1 = -16;
const RAIL_Y2 = 16;
const CARRIAGE_W = 18;
const CARRIAGE_D = 40;
const CARRIAGE_Z = 3;
const CARRIAGE_TOP = 8;
const STOPS = [72, 90, 108]; // DIRECT, SPLIT, GLOBAL

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    [PWR_X - 18, PWR_Y - 24, 38],
    [KNOB_X - KNOB_R, KNOB_Y - KNOB_R, 20],
    [DIAL_X + DIAL_R, DIAL_Y + DIAL_R, DIAL_TOP + 4],
    [RAIL_TO + 6, RAIL_Y2 + 6, CARRIAGE_TOP + 14]
  ],
  WIDTH,
  HEIGHT,
  { pad: 32, azimuth: 44, elevation: 30 }
);

const at = (pt) => k.iso(pt, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

function buildPlate() {
  const out = [];
  // Shadow halo under plate
  out.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`);

  // Rubber feet on cylindrical risers
  for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.8, P, 24), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.2, -PLATE_H - FOOT_H + 1.8, FOOT_H - 1.8, P, 24), { tone: "mid" }));
  }

  // Solid base slab
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));

  // Corner hex mounting screws
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));

  // Engraved metal nameplate in the rear-center
  const tag = { x: -48, y: -58, w: 96, d: 11, r: 1.5 };
  out.push(S(k.slabOf(tag, 0, 0.6, P, 2), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(tag, 0.6, P), { tone: "mid" }));
  out.push(D([at([tag.x + 3.5, tag.y + tag.d / 2, 0.6]), at([tag.x + tag.w - 3.5, tag.y + tag.d / 2, 0.6])], { size: 0.45 }));
  out.push(k.faceTextSvg(k.topMatrix([0, tag.y + tag.d / 2 + 1], 0.6, P, "x"), "CLOAKWIRE CRYPTOGRAPHIC BENCH", { size: 2.3, tone: "hi", anchor: "middle" }));

  // Front vernier ruler strip
  const strip = { x: -110, y: PLATE.y + PLATE.d - 14, w: 220, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 2), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));

  // Surface conduit traces connecting the modules
  const c1From = PWR_BOX.x + PWR_BOX.w;
  const c1To = KNOB_X - KNOB_R - 3;
  out.push(S(k.slabOf({ x: c1From, y: -1.5, w: c1To - c1From, d: 3, r: 0.8 }, 0, 1.8, P, 2), { tone: "lo" }));
  out.push(S(k.slabOf({ x: (c1From + c1To) / 2 - 2, y: -3, w: 4, d: 6, r: 0.8 }, 0, 2.6, P, 2), { tone: "mid" }));
  out.push(D([at([(c1From + c1To) / 2, -2.2, 2.6]), at([(c1From + c1To) / 2, 2.2, 2.6])], { size: 0.35, tone: "lo" }));

  const c2From = KNOB_X + KNOB_R + 3;
  const c2To = DIAL_X - DIAL_R - 3;
  out.push(S(k.slabOf({ x: c2From, y: -1.5, w: c2To - c2From, d: 3, r: 0.8 }, 0, 1.8, P, 2), { tone: "lo" }));
  out.push(S(k.slabOf({ x: (c2From + c2To) / 2 - 2, y: -3, w: 4, d: 6, r: 0.8 }, 0, 2.6, P, 2), { tone: "mid" }));
  out.push(D([at([(c2From + c2To) / 2, -2.2, 2.6]), at([(c2From + c2To) / 2, 2.2, 2.6])], { size: 0.35, tone: "lo" }));

  const c3From = DIAL_X + DIAL_R + 3;
  const c3To = RAIL_FROM - 4;
  out.push(S(k.slabOf({ x: c3From, y: -1.5, w: c3To - c3From, d: 3, r: 0.8 }, 0, 1.8, P, 2), { tone: "lo" }));
  out.push(S(k.slabOf({ x: (c3From + c3To) / 2 - 2, y: -3, w: 4, d: 6, r: 0.8 }, 0, 2.6, P, 2), { tone: "mid" }));
  out.push(D([at([(c3From + c3To) / 2, -2.2, 2.6]), at([(c3From + c3To) / 2, 2.2, 2.6])], { size: 0.35, tone: "lo" }));

  // Conduit pulse flow line
  const pulseLine = k.lineOnTop([c1From, 0], [c3To, 0], 2, P);
  out.push(`<path class="iso-line iso-conduit-flow" data-flow d="${pulseLine}" stroke="#34d399" stroke-width="1.2" opacity="0.85" />`);

  return out.join("");
}

function buildPowerUnit() {
  const out = [];
  // Main milled chassis block
  out.push(S(k.slabOf(PWR_BOX, 0, 9, P, 4, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(PWR_BOX, 9, P), { tone: "hi" }));

  // Corner hex cap screws
  const screws = [
    [PWR_BOX.x + 4, PWR_BOX.y + 4],
    [PWR_BOX.x + PWR_BOX.w - 4, PWR_BOX.y + 4],
    [PWR_BOX.x + 4, PWR_BOX.y + PWR_BOX.d - 4],
    [PWR_BOX.x + PWR_BOX.w - 4, PWR_BOX.y + PWR_BOX.d - 4]
  ];
  out.push(D(screws.map(([x, y]) => at([x, y, 9])), { size: 0.45, tone: "mid" }));

  // Rear pivot hinge upright blocks
  const hinge1 = { x: PWR_X - 5, y: PWR_Y - 13, w: 3, d: 8, r: 0.8 };
  const hinge2 = { x: PWR_X + 2, y: PWR_Y - 13, w: 3, d: 8, r: 0.8 };
  out.push(S(k.slabOf(hinge1, 9, 6.5, P, 2, 0.4), { tone: "hi" }));
  out.push(S(k.slabOf(hinge2, 9, 6.5, P, 2, 0.4), { tone: "hi" }));

  // Front contact jaw uprights
  const jaw1 = { x: PWR_X - 4.5, y: PWR_Y + 7, w: 2.8, d: 6, r: 0.8 };
  const jaw2 = { x: PWR_X + 1.7, y: PWR_Y + 7, w: 2.8, d: 6, r: 0.8 };
  out.push(S(k.slabOf(jaw1, 9, 6, P, 2, 0.3), { tone: "hi" }));
  out.push(S(k.slabOf(jaw2, 9, 6, P, 2, 0.3), { tone: "hi" }));

  // Indicator LED socket in front of jaw
  out.push(S(k.cylinder(PWR_X, PWR_Y + 16, 3.8, 9, 2.2, P, 20), { tone: "lo" }));
  // LED jewel
  const ledPt = at([PWR_X, PWR_Y + 16, 11.2]);
  out.push(`<circle cx="${ledPt[0].toFixed(1)}" cy="${ledPt[1].toFixed(1)}" r="2.8" class="iso-led-glow" fill="#34d399" style="filter: drop-shadow(0 0 6px #10b981); transition: all 0.3s;" />`);

  return `<g data-part="power-unit" class="iso-clickable" style="cursor: pointer;">${out.join("")}</g>`;
}

function buildPowerLever(active = true) {
  const angle = active ? 18 : -32;
  const rad = (angle * Math.PI) / 180;
  const len = 22;
  const zPivot = 12.5;
  const xEnd = PWR_X;
  const yEnd = PWR_Y - 9 + len * Math.sin(rad);
  const zEnd = zPivot + len * Math.cos(rad);

  const out = [];
  // Brass pivot pin
  out.push(S(k.cylinder(PWR_X, PWR_Y - 9, 2, 10, 4.5, P, 16), { tone: "lo" }));

  // Knife blade bar
  const p0 = at([PWR_X, PWR_Y - 9, zPivot]);
  const p1 = at([xEnd, yEnd, zEnd]);
  out.push(`<line x1="${p0[0].toFixed(1)}" y1="${p0[1].toFixed(1)}" x2="${p1[0].toFixed(1)}" y2="${p1[1].toFixed(1)}" stroke="var(--anatomy-hi)" stroke-width="2.8" stroke-linecap="round" />`);

  // Handle insulator sleeve
  const pHandleMid = at([xEnd, yEnd * 0.7 + (PWR_Y - 9) * 0.3, zEnd * 0.7 + zPivot * 0.3]);
  out.push(`<circle cx="${pHandleMid[0].toFixed(1)}" cy="${pHandleMid[1].toFixed(1)}" r="2.5" fill="var(--anatomy-lo)" stroke="var(--anatomy-mid)" stroke-width="0.6" />`);

  // Polished chrome spherical handle knob
  const knobCenter = at([xEnd, yEnd, zEnd]);
  out.push(`<circle cx="${knobCenter[0].toFixed(1)}" cy="${knobCenter[1].toFixed(1)}" r="4.2" fill="var(--anatomy-lit)" stroke="var(--anatomy-strong)" stroke-width="0.8" />`);

  return `<g data-part="power-lever" class="iso-clickable" style="cursor: pointer;">${out.join("")}</g>`;
}

function buildProtocolSelector() {
  const out = [];
  // Raised round collar base
  out.push(S(k.cylinder(KNOB_X, KNOB_Y, KNOB_R + 3.5, 0, 3.5, P, 32), { tone: "mid" }));
  out.push(L(k.ring(KNOB_X, KNOB_Y, KNOB_R + 3.5, 3.5, P, 32), { tone: "hi" }));

  // 4 detent ticks and marks around collar
  const protocols = [
    { name: "VLESS", angle: -135 },
    { name: "HY2", angle: -45 },
    { name: "TUIC", angle: 45 },
    { name: "WG", angle: 135 }
  ];

  for (const proto of protocols) {
    const rad = (proto.angle * Math.PI) / 180;
    const r1 = KNOB_R + 0.8;
    const r2 = KNOB_R + 3.2;
    const t0 = at([KNOB_X + r1 * Math.cos(rad), KNOB_Y + r1 * Math.sin(rad), 3.5]);
    const t1 = at([KNOB_X + r2 * Math.cos(rad), KNOB_Y + r2 * Math.sin(rad), 3.5]);
    out.push(`<line x1="${t0[0].toFixed(1)}" y1="${t0[1].toFixed(1)}" x2="${t1[0].toFixed(1)}" y2="${t1[1].toFixed(1)}" stroke="var(--anatomy-hi)" stroke-width="1.4" stroke-linecap="round" />`);
  }

  // Rotary knob body
  const knobSolids = [];
  knobSolids.push(S(k.cylinder(KNOB_X, KNOB_Y, KNOB_R, 3.5, 11, P, 36, 0.6), { tone: "hi", crease: "lo" }));
  knobSolids.push(L(k.knurl(KNOB_X, KNOB_Y, KNOB_R, 6.5, 12.5, 36, P, 0.4), { tone: "lo" }));
  knobSolids.push(L(k.sideArc(KNOB_X, KNOB_Y, KNOB_R, 6.5, P, 36), { tone: "faint" }));
  knobSolids.push(L(k.sideArc(KNOB_X, KNOB_Y, KNOB_R, 12.5, P, 36), { tone: "faint" }));
  knobSolids.push(L(k.ring(KNOB_X, KNOB_Y, KNOB_R - 2, 14.5, P, 36), { tone: "lo" }));

  out.push(`<g data-part="protocol-knob" class="iso-clickable" style="cursor: pointer;">${knobSolids.join("")}</g>`);
  return out.join("");
}

function buildKnobPointer(angleDeg = -135) {
  const rad = (angleDeg * Math.PI) / 180;
  const pCenter = at([KNOB_X, KNOB_Y, 14.7]);
  const pEdge = at([KNOB_X + (KNOB_R - 4) * Math.cos(rad), KNOB_Y + (KNOB_R - 4) * Math.sin(rad), 14.7]);
  const out = [
    `<line x1="${pCenter[0].toFixed(1)}" y1="${pCenter[1].toFixed(1)}" x2="${pEdge[0].toFixed(1)}" y2="${pEdge[1].toFixed(1)}" stroke="#34d399" stroke-width="2.2" stroke-linecap="round" />`,
    `<circle cx="${pCenter[0].toFixed(1)}" cy="${pCenter[1].toFixed(1)}" r="2.2" fill="var(--anatomy-lit)" stroke="var(--anatomy-strong)" stroke-width="0.8" />`
  ];
  return `<g data-part="knob-pointer" class="iso-clickable" style="cursor: pointer;">${out.join("")}</g>`;
}

function buildLatencyDial() {
  const out = [];
  // Mounting pedestal collar on the base plate
  out.push(S(k.cylinder(DIAL_X, DIAL_Y, DIAL_R + 3, 0, DIAL_Z, P, 32), { tone: "mid" }));
  out.push(L(k.ring(DIAL_X, DIAL_Y, DIAL_R + 3, DIAL_Z, P, 32), { tone: "hi" }));

  // Main dial gauge housing (puck)
  out.push(S(k.cylinder(DIAL_X, DIAL_Y, DIAL_R, DIAL_Z, DIAL_H, P, 48, 0.8), { tone: "hi", crease: "lo" }));
  // Knurled bezel ring
  out.push(L(k.knurl(DIAL_X, DIAL_Y, DIAL_R, DIAL_TOP - 3.2, DIAL_TOP, 48, P, 0.3), { tone: "lo" }));
  out.push(L(k.sideArc(DIAL_X, DIAL_Y, DIAL_R, DIAL_TOP - 3.2, P, 32), { tone: "faint" }));
  out.push(L(k.ring(DIAL_X, DIAL_Y, DIAL_R - 2, DIAL_TOP, P, 48), { tone: "lo" }));

  // Graduated radial ticks on dial face (0 to 100 ms)
  const ticks = k.radialTicks(DIAL_X, DIAL_Y, DIAL_R - 3.2, 36, 6, DIAL_TOP, [1.4, 2.8], P, -Math.PI * 0.75, Math.PI * 1.5);
  out.push(L(ticks.minor, { tone: "lo" }));
  out.push(L(ticks.major, { tone: "mid" }));

  // Center hub ring
  out.push(L(k.ring(DIAL_X, DIAL_Y, 1.8, DIAL_TOP, P, 16), { tone: "mid" }));

  // Engraved ISO face text inside dial
  out.push(k.faceTextSvg(k.topMatrix([DIAL_X, DIAL_Y + 7], DIAL_TOP, P, "x"), "MS", { size: 2.2, tone: "lo", anchor: "middle" }));

  return out.join("");
}

function buildDialNeedle(ms = 22) {
  // Map 0 - 100 ms to -135deg to +135deg
  const angleDeg = -135 + (Math.min(100, Math.max(0, ms)) / 100) * 270;
  const angle = (angleDeg * Math.PI) / 180;
  const pTail = at([DIAL_X - Math.sin(angle) * 3.5, DIAL_Y + Math.cos(angle) * 3.5, DIAL_TOP + 0.3]);
  const pTip = at([DIAL_X + Math.sin(angle) * (DIAL_R - 4.5), DIAL_Y - Math.cos(angle) * (DIAL_R - 4.5), DIAL_TOP + 0.3]);
  const pCenter = at([DIAL_X, DIAL_Y, DIAL_TOP + 0.4]);

  const out = [
    `<line x1="${pTail[0].toFixed(1)}" y1="${pTail[1].toFixed(1)}" x2="${pTip[0].toFixed(1)}" y2="${pTip[1].toFixed(1)}" stroke="#34d399" stroke-width="1.4" stroke-linecap="round" />`,
    `<circle cx="${pCenter[0].toFixed(1)}" cy="${pCenter[1].toFixed(1)}" r="2.2" fill="var(--anatomy-lit)" stroke="var(--anatomy-strong)" stroke-width="0.6" />`
  ];
  return `<g data-part="dial-needle">${out.join("")}</g>`;
}

function buildSplitRails() {
  const out = [];
  // Twin guide rails along x
  for (const y of [RAIL_Y1, RAIL_Y2]) {
    out.push(S(k.slabOf({ x: RAIL_FROM, y: y - 2, w: RAIL_TO - RAIL_FROM, d: 4, r: 1 }, 0, 3, P, 3, 0.4), { tone: "mid" }));
    out.push(D([RAIL_FROM + 5, RAIL_TO - 5].map(x => at([x, y, 3])), { size: 0.4, tone: "mid" }));
  }

  // End stops at both ends
  for (const x of [RAIL_FROM - 4, RAIL_TO]) {
    out.push(S(k.slabOf({ x, y: RAIL_Y1 - 4, w: 5, d: (RAIL_Y2 - RAIL_Y1) + 8, r: 1.2 }, 0, 7, P, 3, 0.5), { tone: "mid" }));
    out.push(D([at([x + 2.5, RAIL_Y1, 7]), at([x + 2.5, RAIL_Y2, 7])], { size: 0.45, tone: "mid" }));
  }

  // Engraved index detent stops along the rail center
  for (let idx = 0; idx < STOPS.length; idx++) {
    const x = STOPS[idx];
    out.push(`<g data-part="mode-stop" data-mode-idx="${idx}" class="iso-clickable" style="cursor: pointer;">`);
    out.push(D([at([x, 0, 0.6])], { size: 0.8, tone: "hi" }));
    out.push(L(k.ring(x, 0, 2.2, 0.6, P, 16), { tone: "mid" }));
    out.push(`</g>`);
  }

  return out.join("");
}

function buildCarriage() {
  const out = [];
  // Main sliding carriage block
  const cBox = { x: -CARRIAGE_W / 2, y: -CARRIAGE_D / 2, w: CARRIAGE_W, d: CARRIAGE_D, r: 3 };
  out.push(S(k.slabOf(cBox, CARRIAGE_Z, CARRIAGE_TOP - CARRIAGE_Z, P, 5, 0.6), { tone: "mid" }));

  // Sleeve bushings at corners
  const bushings = [
    [-CARRIAGE_W / 2 + 3.5, RAIL_Y1],
    [CARRIAGE_W / 2 - 3.5, RAIL_Y1],
    [-CARRIAGE_W / 2 + 3.5, RAIL_Y2],
    [CARRIAGE_W / 2 - 3.5, RAIL_Y2]
  ];
  for (const [bx, by] of bushings) {
    out.push(S(k.cylinder(bx, by, 3.2, CARRIAGE_Z, 6, P, 16), { tone: "lo" }));
    out.push(D([at([bx, by, CARRIAGE_Z + 6])], { size: 0.4, tone: "mid" }));
  }

  // Knurled thumbscrew lock on top
  out.push(S(k.cylinder(0, 0, 5, CARRIAGE_TOP, 5, P, 24), { tone: "hi" }));
  out.push(L(k.knurl(0, 0, 5, CARRIAGE_TOP + 1, CARRIAGE_TOP + 5, 24, P), { tone: "lo" }));
  out.push(D([at([0, 0, CARRIAGE_TOP + 5])], { size: 0.6, tone: "lit" }));

  // Vernier pointer triangle pointing to detent stop
  const pTip = at([0, CARRIAGE_D / 2 + 1.5, CARRIAGE_Z]);
  const pLeft = at([-2.5, CARRIAGE_D / 2 - 2, CARRIAGE_Z]);
  const pRight = at([2.5, CARRIAGE_D / 2 - 2, CARRIAGE_Z]);
  out.push(`<polygon points="${pTip[0]},${pTip[1]} ${pLeft[0]},${pLeft[1]} ${pRight[0]},${pRight[1]}" fill="#34d399" />`);

  return `<g data-part="carriage" class="iso-draggable" style="cursor: grab;">${out.join("")}</g>`;
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
  @keyframes iso-flow{to{stroke-dashoffset:-32}}
  .iso-line[data-flow]{animation:iso-flow 1600ms linear infinite}
`;

export function generateFigureSvg({ standalone = false } = {}) {
  const parts = [
    buildPlate(),
    buildPowerUnit(),
    buildPowerLever(true),
    buildProtocolSelector(),
    buildKnobPointer(-135),
    buildLatencyDial(),
    buildDialNeedle(22),
    buildSplitRails(),
    `<g data-part="carriage-group" transform="${k.translateAlong(P, [STOPS[1], 0, 0])}">${buildCarriage()}</g>`
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
  const conduitFlow = svg.querySelector('.iso-conduit-flow');
  const readout = root.querySelector('[data-readout]');

  // Projection constants
  const P = ${JSON.stringify(P)};
  const STOPS = ${JSON.stringify(STOPS)};
  const PWR_X = ${PWR_X};
  const PWR_Y = ${PWR_Y};
  const KNOB_X = ${KNOB_X};
  const KNOB_Y = ${KNOB_Y};
  const KNOB_R = ${KNOB_R};
  const DIAL_X = ${DIAL_X};
  const DIAL_Y = ${DIAL_Y};
  const DIAL_R = ${DIAL_R};
  const DIAL_TOP = ${DIAL_TOP};

  const PROTOCOLS = [
    { name: "VLESS", ping: 22, angle: -135 },
    { name: "HY2", ping: 31, angle: -45 },
    { name: "TUIC", ping: 27, angle: 45 },
    { name: "WG", ping: 18, angle: 135 }
  ];

  const MODES = ["DIRECT", "SPLIT", "GLOBAL"];

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
      readout.textContent = "TUNNEL DISENGAGED · STANDBY";
    }
  }

  function updatePowerVisual() {
    if (!lever) return;
    const angle = powerOn ? 18 : -32;
    const rad = (angle * Math.PI) / 180;
    const len = 22;
    const zPivot = 12.5;
    const xEnd = PWR_X;
    const yEnd = PWR_Y - 9 + len * Math.sin(rad);
    const zEnd = zPivot + len * Math.cos(rad);

    const p0 = iso([PWR_X, PWR_Y - 9, zPivot]);
    const p1 = iso([xEnd, yEnd, zEnd]);
    const pHandleMid = iso([xEnd, yEnd * 0.7 + (PWR_Y - 9) * 0.3, zEnd * 0.7 + zPivot * 0.3]);

    lever.innerHTML = '<line x1="' + p0[0].toFixed(1) + '" y1="' + p0[1].toFixed(1) + '" x2="' + p1[0].toFixed(1) + '" y2="' + p1[1].toFixed(1) + '" stroke="var(--anatomy-hi)" stroke-width="2.8" stroke-linecap="round" />' +
      '<circle cx="' + pHandleMid[0].toFixed(1) + '" cy="' + pHandleMid[1].toFixed(1) + '" r="2.5" fill="var(--anatomy-lo)" stroke="var(--anatomy-mid)" stroke-width="0.6" />' +
      '<circle cx="' + p1[0].toFixed(1) + '" cy="' + p1[1].toFixed(1) + '" r="4.2" fill="var(--anatomy-lit)" stroke="var(--anatomy-strong)" stroke-width="0.8" />';

    if (led) {
      led.setAttribute("fill", powerOn ? "#34d399" : "#374151");
      led.style.filter = powerOn ? "drop-shadow(0 0 6px #10b981)" : "none";
    }

    if (conduitFlow) {
      conduitFlow.style.opacity = powerOn ? "0.85" : "0.15";
    }
  }

  function updateKnobVisual() {
    if (!pointer) return;
    const proto = PROTOCOLS[protoIdx];
    const rad = (proto.angle * Math.PI) / 180;
    const pCenter = iso([KNOB_X, KNOB_Y, 14.7]);
    const pEdge = iso([KNOB_X + (KNOB_R - 4) * Math.cos(rad), KNOB_Y + (KNOB_R - 4) * Math.sin(rad), 14.7]);
    pointer.innerHTML = '<line x1="' + pCenter[0].toFixed(1) + '" y1="' + pCenter[1].toFixed(1) + '" x2="' + pEdge[0].toFixed(1) + '" y2="' + pEdge[1].toFixed(1) + '" stroke="#34d399" stroke-width="2.2" stroke-linecap="round" />' +
      '<circle cx="' + pCenter[0].toFixed(1) + '" cy="' + pCenter[1].toFixed(1) + '" r="2.2" fill="var(--anatomy-lit)" stroke="var(--anatomy-strong)" stroke-width="0.8" />';
  }

  function updateNeedleVisual() {
    if (!needleGroup) return;
    const ms = powerOn ? currentPing : 0;
    const angleDeg = -135 + (Math.min(100, Math.max(0, ms)) / 100) * 270;
    const angle = (angleDeg * Math.PI) / 180;
    const pTail = iso([DIAL_X - Math.sin(angle) * 3.5, DIAL_Y + Math.cos(angle) * 3.5, DIAL_TOP + 0.3]);
    const pTip = iso([DIAL_X + Math.sin(angle) * (DIAL_R - 4.5), DIAL_Y - Math.cos(angle) * (DIAL_R - 4.5), DIAL_TOP + 0.3]);
    const pCenter = iso([DIAL_X, DIAL_Y, DIAL_TOP + 0.4]);

    needleGroup.innerHTML = '<line x1="' + pTail[0].toFixed(1) + '" y1="' + pTail[1].toFixed(1) + '" x2="' + pTip[0].toFixed(1) + '" y2="' + pTip[1].toFixed(1) + '" stroke="#34d399" stroke-width="1.4" stroke-linecap="round" />' +
      '<circle cx="' + pCenter[0].toFixed(1) + '" cy="' + pCenter[1].toFixed(1) + '" r="2.2" fill="var(--anatomy-lit)" stroke="var(--anatomy-strong)" stroke-width="0.6" />';
  }

  function updateCarriageVisual() {
    if (!carriageGroup) return;
    const a = P.azimuth * (Math.PI / 180);
    const e = P.elevation * (Math.PI / 180);
    const k = P.scale * Math.sqrt(1.6);
    const dx = (carriageX * Math.sin(a)) * k;
    const dy = (carriageX * Math.cos(a) * Math.sin(e)) * k;
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
      targetPing = PROTOCOLS[protoIdx].ping + (Math.sin(now / 400) * 1.8) + (Math.cos(now / 150) * 0.9);
      throughputMB = 12.8 + Math.sin(now / 550) * 2.6;
    } else {
      targetPing = 0;
      throughputMB = 0;
    }
    currentPing += (targetPing - currentPing) * (1 - Math.exp(-dt / 0.12));

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
    const ratio = Math.max(0, Math.min(1, (clickX / rect.width - 0.55) / 0.3));
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
    fig: "Fig 1.0",
    title: "CRYPTOGRAPHIC BENCH",
    hint: "Toggle switch · Rotate knob · Drag rail",
    readout: "VLESS · SPLIT · 22 ms · 15 MB/s",
    keys: [
      { mark: "green", label: "Active encrypted path / Live status" },
      { mark: "lit", label: "Controls: Knife-switch, selector dial, routing carriage" },
      { mark: "mid", label: "Precision analog latency meter (0 - 100 ms)" }
    ],
    caption: "Cloakwire Dual-Core Hardware Gateway: interact with the mechanical switch, protocol rotary selector, and routing carriage to inspect tunnel status and latency in real time.",
    body: `<div class="iso-cloakwire-card"><div class="iso-stage" tabindex="0">${svg}</div></div>`
  });

  return k.pageHtml({
    title: "Cloakwire Cryptographic Bench Unit",
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

// 3. Update docs/index.html with interactive unit
export function patchLandingPage() {
  const indexPath = join(docsDir, "index.html");
  let content = readFileSync(indexPath, "utf8");

  // Bump version numbers
  content = content.replaceAll("1.4.2", "1.4.6");

  // Inject ISO styles into <head>
  const customIsoCss = `
    /* ANATOMY_ISO_CSS */
    ${k.ISO_CSS}
    .iso-plate {
      position: relative;
      border-radius: 1.25rem;
      border: 1px solid rgba(52, 211, 153, 0.25);
      background: radial-gradient(circle at 50% 0%, rgba(20, 24, 35, 0.85) 0%, rgba(10, 11, 16, 0.95) 100%);
      backdrop-filter: blur(16px);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
      padding: 44px 20px 36px;
      overflow: hidden;
    }
    .iso-stage { outline: none; }
    .iso-clickable, .iso-draggable { transition: filter 0.2s ease, opacity 0.2s ease; }
    .iso-clickable:hover { filter: drop-shadow(0 0 8px rgba(52, 211, 153, 0.65)); }
    .iso-draggable:hover { filter: drop-shadow(0 0 8px rgba(148, 163, 184, 0.5)); }
    
    @keyframes conduitPulse {
      from { stroke-dashoffset: 24; }
      to { stroke-dashoffset: 0; }
    }
    .iso-conduit-flow {
      stroke-dasharray: 6 6;
      animation: conduitPulse 1.2s linear infinite;
    }
    
    .iso-plate-corner {
      white-space: nowrap;
      user-select: none;
    }
    @media (max-width: 640px) {
      .iso-plate {
        padding: 36px 12px 28px;
      }
      .iso-plate-corner[data-corner="title"] {
        display: none !important;
      }
      .iso-plate-corner[data-corner="hint"] {
        display: none !important;
      }
      .iso-plate-corner[data-corner="fig"] {
        font-size: 11px;
        top: 10px;
        left: 14px;
      }
      .iso-plate-corner[data-corner="readout"] {
        font-size: 11px;
        right: 14px;
        bottom: 10px;
      }
    }
  `;

  if (content.includes("/* ANATOMY_ISO_CSS */")) {
    content = content.replace(/\/\* ANATOMY_ISO_CSS \*\/[\s\S]*?<\/style>/, `${customIsoCss}\n  </style>`);
  } else {
    content = content.replace("</style>", `${customIsoCss}\n  </style>`);
  }

  // Ensure body has class "iso" and data-theme="dark"
  if (!content.includes('class="iso')) {
    content = content.replace('<body class="', '<body class="iso ');
  }
  if (!content.includes('data-theme="dark"')) {
    content = content.replace('<body ', '<body data-theme="dark" ');
  }

  // Replace or inject interactive section
  const figureSectionMarker = "<!-- Interactive Anatomy Architectural Unit Section -->";
  const svgForLanding = generateFigureSvg({ standalone: false });
  const plateHtml = k.plateHtml({
    fig: "Fig 1.0",
    title: "CRYPTOGRAPHIC BENCH",
    hint: "Toggle switch · Rotate knob · Drag rail",
    readout: "VLESS · SPLIT · 22 ms · 15 MB/s",
    keys: [
      { mark: "green", label: "Active encrypted path / Live status indicator" },
      { mark: "lit", label: "Controls: Knife-switch, selector dial, routing carriage" },
      { mark: "mid", label: "Precision analog latency meter (0 - 100 ms)" }
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

  if (content.includes(figureSectionMarker)) {
    // Replace existing section
    content = content.replace(/<!-- Interactive Anatomy Architectural Unit Section -->[\s\S]*?<\/section>/, sectionHtml.trim());
  } else {
    const heroShowcaseEnd = '</div>\n    </section>';
    content = content.replace(heroShowcaseEnd, `</div>\n    </section>\n${sectionHtml}`);
  }

  // Update client script
  const scriptMarker = "<!-- ANATOMY_CLIENT_SCRIPT -->";
  const scriptBlock = `
  ${scriptMarker}
  <script type="module">
  ${CLIENT_SCRIPT}
  </script>
  `;

  if (content.includes(scriptMarker)) {
    content = content.replace(/<!-- ANATOMY_CLIENT_SCRIPT -->[\s\S]*?<\/script>/, scriptBlock.trim());
  } else {
    content = content.replace("</body>", `${scriptBlock}\n</body>`);
  }

  // Add nav link to #model in header if not present
  if (!content.includes('href="#model"')) {
    content = content.replace(
      '<a href="#features" class="hover:text-white transition-colors">Features</a>',
      '<a href="#model" class="hover:text-white transition-colors">Architecture</a>\n        <a href="#features" class="hover:text-white transition-colors">Features</a>'
    );
  }

  writeFileSync(indexPath, content, "utf8");
  console.log("Successfully patched docs/index.html with refined Anatomy figure!");
}

patchLandingPage();
