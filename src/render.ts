import {
  BASE_SPEED,
  CANVAS_H,
  CANVAS_W,
  ENEMY,
  HORIZON_Y,
  LANE_SCREEN,
  LANE_X,
  NEAR_Y,
  ROAD_HALF,
  SPAWN_Z,
  TEAM_Z,
  WEAPONS,
} from "./config";
import {
  drawSprite,
  getSprite,
  holeOf,
  muzzleOf,
  type SpriteId,
} from "./assets";
import type { Bullet } from "./bullets";
import type { Enemy } from "./enemies";
import type { Gate } from "./gates";
import type { Particle } from "./particles";
import type { Squad } from "./squad";
import { drawEllipse, formatTime, project, roundRect } from "./utils";

const PROJ = {
  w: CANVAS_W,
  horizonY: HORIZON_Y,
  nearY: NEAR_Y,
  teamZ: TEAM_Z,
  laneX: LANE_X,
  laneScreen: LANE_SCREEN,
};

export function pr(x: number, y: number, z: number, camX: number) {
  return project(x, y, z, camX, PROJ);
}

const TREE_ZS = [15, 20, 25, 31, 37, 44, 51, 58, 66, 74, 83];
const HOUSE_ZS = [17, 26, 35, 44, 53, 62, 71, 81];

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  camX: number,
  time: number,
  shakeX: number,
  shakeY: number,
): void {
  ctx.save();
  ctx.translate(shakeX, shakeY);

  drawSky(ctx, camX);

  const grass = ctx.createLinearGradient(0, HORIZON_Y, 0, CANVAS_H);
  grass.addColorStop(0, "#C8C49A");
  grass.addColorStop(0.4, "#B3B880");
  grass.addColorStop(1, "#8EA86A");
  ctx.fillStyle = grass;
  ctx.fillRect(0, HORIZON_Y + 6, CANVAS_W, CANVAS_H - HORIZON_Y);

  drawRoad(ctx, camX, time);
  drawRoadside(ctx, camX, time);

  ctx.restore();
}

function drawSky(ctx: CanvasRenderingContext2D, camX: number): void {
  const sky = getSprite("sky");
  const horizon = HORIZON_Y + 52;
  if (sky) {
    const drawW = CANVAS_W * 1.36;
    const drawH = drawW * ((sky.naturalHeight || sky.height) / (sky.naturalWidth || sky.width));
    const x = (CANVAS_W - drawW) / 2 - camX * 22;
    const y = horizon - drawH;
    if (y > 0) {
      ctx.fillStyle = "#F6C29A";
      ctx.fillRect(0, 0, CANVAS_W, y + 4);
    }
    ctx.drawImage(sky, x, y, drawW, drawH);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, "#F8C9A0");
    g.addColorStop(0.55, "#F4B48A");
    g.addColorStop(1, "#E8C9A8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_W, horizon + 20);
  }
}

function drawRoad(ctx: CanvasRenderingContext2D, camX: number, time: number): void {
  const far = pr(-ROAD_HALF, 0, SPAWN_Z + 10, camX);
  const farR = pr(ROAD_HALF, 0, SPAWN_Z + 10, camX);
  const near = pr(-ROAD_HALF, 0, 8.5, camX);
  const nearR = pr(ROAD_HALF, 0, 8.5, camX);

  ctx.fillStyle = "#8E9198";
  ctx.beginPath();
  ctx.moveTo(far.sx, far.sy);
  ctx.lineTo(farR.sx, farR.sy);
  ctx.lineTo(nearR.sx, nearR.sy);
  ctx.lineTo(near.sx, near.sy);
  ctx.closePath();
  ctx.fill();

  // 路边石
  ctx.fillStyle = "#D9CDB6";
  const curbL0 = pr(-ROAD_HALF - 0.45, 0, SPAWN_Z + 10, camX);
  const curbL1 = pr(-ROAD_HALF, 0, SPAWN_Z + 10, camX);
  const curbL2 = pr(-ROAD_HALF, 0, 8.5, camX);
  const curbL3 = pr(-ROAD_HALF - 0.45, 0, 8.5, camX);
  ctx.beginPath();
  ctx.moveTo(curbL0.sx, curbL0.sy);
  ctx.lineTo(curbL1.sx, curbL1.sy);
  ctx.lineTo(curbL2.sx, curbL2.sy);
  ctx.lineTo(curbL3.sx, curbL3.sy);
  ctx.closePath();
  ctx.fill();
  const curbR0 = pr(ROAD_HALF, 0, SPAWN_Z + 10, camX);
  const curbR1 = pr(ROAD_HALF + 0.45, 0, SPAWN_Z + 10, camX);
  const curbR2 = pr(ROAD_HALF + 0.45, 0, 8.5, camX);
  const curbR3 = pr(ROAD_HALF, 0, 8.5, camX);
  ctx.beginPath();
  ctx.moveTo(curbR0.sx, curbR0.sy);
  ctx.lineTo(curbR1.sx, curbR1.sy);
  ctx.lineTo(curbR2.sx, curbR2.sy);
  ctx.lineTo(curbR3.sx, curbR3.sy);
  ctx.closePath();
  ctx.fill();

  // 中线虚线随道路向前滚（速度沿用 BASE_SPEED，只改外观）
  drawDashLine(ctx, 0, camX, "#F3EEDC", 7, time);
}

function wrapZ(base: number, time: number, minZ: number, maxZ: number): number {
  const span = maxZ - minZ;
  const raw = base - time * BASE_SPEED;
  return minZ + ((((raw - minZ) % span) + span) % span);
}

function drawDashLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  camX: number,
  color: string,
  width: number,
  time: number,
): void {
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  const period = 3.2;
  const off = (time * BASE_SPEED) % period;
  for (let z = 10 + (period - off); z < SPAWN_Z + 8; z += period) {
    const a = pr(x, 0.03, z, camX);
    const b = pr(x, 0.03, Math.min(z + 1.4, SPAWN_Z + 8), camX);
    ctx.lineWidth = Math.max(1.5, width * a.scale);
    ctx.beginPath();
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(b.sx, b.sy);
    ctx.stroke();
  }
}

function drawRoadside(ctx: CanvasRenderingContext2D, camX: number, time: number): void {
  type Prop = { kind: "tree" | "house"; side: -1 | 1; z: number; variant: number };
  const props: Prop[] = [];
  for (let i = 0; i < TREE_ZS.length; i++) {
    props.push({ kind: "tree", side: -1, z: wrapZ(TREE_ZS[i], time, 11, 92), variant: i % 2 });
    props.push({ kind: "tree", side: 1, z: wrapZ(TREE_ZS[i] + 3.4, time, 11, 92), variant: (i + 1) % 2 });
  }
  for (let i = 0; i < HOUSE_ZS.length; i++) {
    props.push({ kind: "house", side: -1, z: wrapZ(HOUSE_ZS[i], time, 14, 94), variant: i % 4 });
    props.push({ kind: "house", side: 1, z: wrapZ(HOUSE_ZS[i] + 5.5, time, 14, 94), variant: (i + 2) % 4 });
  }
  props.sort((a, b) => b.z - a.z);
  for (const p of props) {
    if (p.kind === "tree") {
      const x = p.side < 0 ? -ROAD_HALF - 1.85 : ROAD_HALF + 1.9;
      const q = pr(x, 0, p.z, camX);
      const k = q.scale;
      if (k < 0.08) continue;
      const id: SpriteId = p.variant === 0 ? "tree_0" : "tree_1";
      drawSprite(ctx, id, q.sx, q.sy + 4 * k, 170 * k, { flip: p.side > 0 });
    } else {
      const x = p.side < 0 ? -ROAD_HALF - 4.35 : ROAD_HALF + 4.45;
      const q = pr(x, 0, p.z, camX);
      const k = q.scale;
      if (k < 0.08) continue;
      const id = ("house_" + p.variant) as SpriteId;
      drawSprite(ctx, id, q.sx, q.sy + 6 * k, 230 * k, { flip: p.side > 0 });
    }
  }
}

export function drawGate(ctx: CanvasRenderingContext2D, g: Gate, camX: number): void {
  const p = pr(g.x, 0, g.z, camX);
  const k = p.scale;
  const id: SpriteId = g.kind === "red" ? "gate_coral" : (g.kind === "weapon" || g.kind === "amp") ? "gate_gold" : "gate_blue";
  const h = 210 * k;
  const img = getSprite(id);
  if (img) {
    const size = drawSprite(ctx, id, p.sx, p.sy + 4 * k, h);
    const w = size ? size.w : h * 0.95;
    const hole = holeOf(id);
    const hx = p.sx + (hole[0] - 0.5) * w;
    const hy = p.sy + 4 * k - h + hole[1] * h;
    if (g.kind === "weapon") {
      const iconH = 56 * k;
      const icon = getSprite("icon_smg") ? "icon_smg" : "icon_pistol";
      drawSprite(ctx, icon, hx, hy + iconH * 0.45, iconH);
    } else {
      drawGateLabel(ctx, g.label, hx, hy, k, g.kind === "red", g.kind === "amp");
    }
    return;
  }
  // 素材未就绪时的简单回退
  fallbackGate(ctx, p.sx, p.sy, k, g);
}

function drawGateLabel(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  k: number,
  danger: boolean,
  gold = false,
): void {
  const fontSize = Math.max(16, (label.length > 2 ? 44 : 54) * k);
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${fontSize}px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif`;
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.lineWidth = Math.max(3, fontSize * 0.14);
  ctx.strokeStyle = danger ? "rgba(110,30,30,0.45)" : gold ? "rgba(120,70,10,0.5)" : "rgba(25,50,110,0.4)";
  ctx.strokeText(label, x, y);
  ctx.fillStyle = gold ? "#FFF4B8" : "#FFFFFF";
  ctx.fillText(label, x, y);
  ctx.restore();
}

function fallbackGate(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  k: number,
  g: Gate,
): void {
  const w = 148 * k;
  const h = 168 * k;
  const x = sx - w / 2;
  const y = sy - h;
  let frame = "#3B82F6";
  if (g.kind === "red") frame = "#E5736A";
  else if (g.kind === "weapon" || g.kind === "amp") frame = "#F0C033";
  ctx.strokeStyle = frame;
  ctx.lineWidth = Math.max(6, 16 * k);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + 10 * k, sy - 8 * k);
  ctx.arc(sx, y + w * 0.15, w * 0.48, Math.PI, 0);
  ctx.lineTo(x + w - 10 * k, sy - 8 * k);
  ctx.stroke();
  if (g.kind === "weapon") return;
  drawGateLabel(ctx, g.label, sx, y + h * 0.5, k, g.kind === "red", g.kind === "amp");
}

export function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, camX: number): void {
  const p = pr(e.x, e.y, e.z, camX);
  const def = ENEMY[e.type];
  const stretch = e.type === "jumper" && e.airborne ? 1 + Math.min(0.45, e.y * 0.18) : 1;
  const k = p.scale * def.scale;
  const lean = e.type === "sprinter" && e.dashing > 0 ? 10 * k : e.type === "sprinter" ? 4 * k : 0;

  ctx.save();
  ctx.translate(p.sx + lean, p.sy);
  ctx.fillStyle = "rgba(40,50,30,0.22)";
  drawEllipse(ctx, 0, 2 * k, 24 * k, 8 * k);
  ctx.fill();

  const flash = e.hitFlash > 0 ? Math.min(1, e.hitFlash * 5) : 0;
  if (e.type === "sprinter") {
    const h = 118 * k;
    if (!drawSprite(ctx, "sprinter_0", 0, 0, h, { flash })) {
      fallbackEnemy(ctx, k, true, flash);
    }
  } else if (e.type === "walker") {
    const frame: SpriteId = Math.sin(e.walk) >= 0 ? "walker_0" : "walker_1";
    const h = 122 * k;
    if (!drawSprite(ctx, frame, 0, 0, h, { flash })) {
      fallbackEnemy(ctx, k, false, flash);
    }
  } else {
    drawSpecialEnemy(ctx, e, k * stretch, flash);
  }
  ctx.restore();
}

function clayBody(
  ctx: CanvasRenderingContext2D,
  k: number,
  flash: number,
  color: string,
  bodyW: number,
  bodyH: number,
  headR: number,
  headY: number,
): void {
  ctx.fillStyle = flash > 0 ? "#FFFFFF" : color;
  drawEllipse(ctx, 0, -bodyH * 0.45 * k, bodyW * k, bodyH * 0.55 * k);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -headY * k, headR * k, 0, Math.PI * 2);
  ctx.fill();
  if (flash <= 0) {
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath();
    ctx.ellipse(-headR * 0.28 * k, -headY * k - headR * 0.22 * k, headR * 0.28 * k, headR * 0.18 * k, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSpecialEnemy(ctx: CanvasRenderingContext2D, e: Enemy, k: number, flash: number): void {
  if (e.type === "shield") {
    clayBody(ctx, k, flash, "#8FB88A", 24, 50, 16, 58);
    ctx.fillStyle = flash > 0 ? "#FFFFFF" : "#D7B07A";
    roundRect(ctx, -22 * k, -54 * k, 28 * k, 42 * k, 10 * k);
    ctx.fill();
    ctx.fillStyle = flash > 0 ? "#FFFFFF" : "#E8C992";
    ctx.beginPath();
    ctx.arc(-8 * k, -36 * k, 7 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(110,70,30,0.35)";
    ctx.lineWidth = Math.max(1.5, 2.5 * k);
    ctx.beginPath();
    ctx.arc(-8 * k, -36 * k, 7 * k, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }
  if (e.type === "bomber") {
    clayBody(ctx, k, flash, "#E39A3A", 26, 48, 15, 54);
    ctx.fillStyle = flash > 0 ? "#FFFFFF" : "#5A4638";
    ctx.beginPath();
    ctx.arc(0, -22 * k, 12 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#C9A15A";
    ctx.fillRect(-2 * k, -38 * k, 4 * k, 8 * k);
    ctx.fillStyle = "#FFE27A";
    ctx.beginPath();
    ctx.arc(0, -40 * k, 3.2 * k, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (e.type === "splitter" || e.type === "splitling") {
    const chubby = e.type === "splitling" ? 0.85 : 1;
    clayBody(ctx, k * chubby, flash, "#9FCF96", 26, 46, 14, 54);
    if (e.type === "splitter") {
      ctx.fillStyle = flash > 0 ? "#FFFFFF" : "#8FBF88";
      ctx.beginPath();
      ctx.arc(16 * k, -50 * k, 11 * k, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.beginPath();
      ctx.ellipse(13 * k, -53 * k, 3.5 * k, 2.4 * k, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  if (e.type === "jumper") {
    clayBody(ctx, k, flash, "#7BA24A", 16, 44, 13, 58);
    ctx.fillStyle = flash > 0 ? "#FFFFFF" : "#6A9140";
    roundRect(ctx, -11 * k, -22 * k, 8 * k, 22 * k, 4 * k);
    ctx.fill();
    roundRect(ctx, 3 * k, -22 * k, 8 * k, 22 * k, 4 * k);
    ctx.fill();
    return;
  }
  fallbackEnemy(ctx, k, false, flash);
}

function fallbackEnemy(ctx: CanvasRenderingContext2D, k: number, sprint: boolean, flash: number): void {
  ctx.fillStyle = flash > 0 ? "#FFFFFF" : sprint ? "#7BA24A" : "#9FD6B0";
  drawEllipse(ctx, 0, -28 * k, sprint ? 16 * k : 22 * k, sprint ? 22 * k : 24 * k);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, sprint ? -52 * k : -56 * k, sprint ? 13 * k : 16 * k, 0, Math.PI * 2);
  ctx.fill();
}

export function drawLaneWarning(
  ctx: CanvasRenderingContext2D,
  lane: "left" | "right",
  camX: number,
  timeLeft: number,
): void {
  const x = lane === "left" ? -LANE_X : LANE_X;
  const farL = pr(x - 2.4, 0, SPAWN_Z - 4, camX);
  const farR = pr(x + 2.4, 0, SPAWN_Z - 4, camX);
  const nearL = pr(x - 2.4, 0, 10, camX);
  const nearR = pr(x + 2.4, 0, 10, camX);
  const pulse = 0.18 + Math.max(0, 1.2 - timeLeft) * 0.16 + Math.sin(timeLeft * 16) * 0.05;
  ctx.save();
  ctx.fillStyle = `rgba(210, 48, 40, ${Math.max(0.12, Math.min(0.42, pulse))})`;
  ctx.beginPath();
  ctx.moveTo(farL.sx, farL.sy);
  ctx.lineTo(farR.sx, farR.sy);
  ctx.lineTo(nearR.sx, nearR.sy);
  ctx.lineTo(nearL.sx, nearL.sy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawProp(ctx: CanvasRenderingContext2D, p: { kind: string; x: number; z: number; hp: number; maxHp: number }, camX: number): void {
  const s = pr(p.x, 0, p.z, camX);
  const k = s.scale;
  ctx.save();
  ctx.translate(s.sx, s.sy);
  ctx.fillStyle = "rgba(40,50,30,0.22)";
  drawEllipse(ctx, 0, 2 * k, 26 * k, 9 * k);
  ctx.fill();
  if (p.kind === "cage") {
    ctx.fillStyle = "#C9A56A";
    roundRect(ctx, -28 * k, -70 * k, 56 * k, 70 * k, 8 * k);
    ctx.fill();
    ctx.fillStyle = "#E8D3A0";
    roundRect(ctx, -22 * k, -64 * k, 44 * k, 52 * k, 6 * k);
    ctx.fill();
    ctx.strokeStyle = "rgba(90,55,25,0.7)";
    ctx.lineWidth = Math.max(2, 3.5 * k);
    for (let i = -12; i <= 12; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i * k, -62 * k);
      ctx.lineTo(i * k, -16 * k);
      ctx.stroke();
    }
    ctx.fillStyle = "#E2B84A";
    ctx.beginPath();
    ctx.arc(0, -38 * k, 8 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5A3E22";
    ctx.font = `bold ${Math.max(10, 16 * k)}px "PingFang SC","Microsoft YaHei",sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("人质", 0, -80 * k);
    drawPropHp(ctx, p, 32 * k, k);
  } else {
    ctx.fillStyle = "#D9853A";
    roundRect(ctx, -18 * k, -58 * k, 36 * k, 58 * k, 10 * k);
    ctx.fill();
    ctx.fillStyle = "#E8C45A";
    ctx.fillRect(-18 * k, -40 * k, 36 * k, 10 * k);
    ctx.fillStyle = "#F4E2B0";
    ctx.beginPath();
    ctx.ellipse(0, -58 * k, 16 * k, 6 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5A3E22";
    ctx.font = `bold ${Math.max(10, 15 * k)}px "PingFang SC","Microsoft YaHei",sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("油桶", 0, -72 * k);
    drawPropHp(ctx, p, 24 * k, k);
  }
  ctx.restore();
}

function drawPropHp(
  ctx: CanvasRenderingContext2D,
  p: { hp: number; maxHp: number },
  y: number,
  k: number,
): void {
  const w = 36 * k;
  const h = 5 * k;
  ctx.fillStyle = "rgba(40,30,20,0.35)";
  roundRect(ctx, -w / 2, -y, w, h, 2 * k);
  ctx.fill();
  const t = Math.max(0, p.hp / Math.max(0.01, p.maxHp));
  ctx.fillStyle = "#7BB24A";
  roundRect(ctx, -w / 2, -y, w * t, h, 2 * k);
  ctx.fill();
}

export function drawSoldier(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  scale: number,
  bob: number,
  flash: number,
  weapon: "pistol" | "smg",
): void {
  const k = scale;
  const bounce = Math.sin(bob) * 2.6 * k;
  const frame = Math.sin(bob) >= 0 ? 0 : 1;
  const id: SpriteId = weapon === "smg"
    ? (frame === 0 ? "soldier_smg_0" : "soldier_smg_1")
    : (frame === 0 ? "soldier_pistol_0" : "soldier_pistol_1");

  ctx.save();
  ctx.translate(sx, sy + bounce);
  ctx.fillStyle = "rgba(40,50,30,0.22)";
  drawEllipse(ctx, 0, 2 * k, 20 * k, 7 * k);
  ctx.fill();

  const h = 118 * k;
  const size = drawSprite(ctx, id, 0, 0, h, { flash: flash > 0 ? 0.9 : 0 });
  if (!size) {
    ctx.fillStyle = flash > 0 ? "#FFFFFF" : "#6B7F3A";
    roundRect(ctx, -14 * k, -48 * k, 28 * k, 48 * k, 8 * k);
    ctx.fill();
    ctx.restore();
    return;
  }

  // 圆润火光：按跑动节奏闪，冲锋枪更密
  const rate = weapon === "smg" ? 7.2 : 3.4;
  if (Math.sin(bob * rate) > 0.55) {
    const mz = muzzleOf(id);
    const mx = (mz[0] - 0.5) * size.w;
    const my = -h + mz[1] * h;
    drawMuzzleFlash(ctx, mx, my, k * (weapon === "smg" ? 1.15 : 1));
  }
  ctx.restore();
}

function drawMuzzleFlash(ctx: CanvasRenderingContext2D, x: number, y: number, k: number): void {
  ctx.save();
  ctx.translate(x, y);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 16 * k);
  g.addColorStop(0, "rgba(255,255,230,0.95)");
  g.addColorStop(0.35, "rgba(255,200,70,0.9)");
  g.addColorStop(1, "rgba(255,140,40,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 16 * k, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFE27A";
  drawStar(ctx, 0, 0, 5, 13 * k, 5 * k);
  ctx.fill();
  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  n: number,
  outer: number,
  inner: number,
): void {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / n - Math.PI / 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function squadVisualScale(n: number): number {
  if (n <= 1) return 1.36;
  if (n <= 2) return 1.05;
  if (n <= 4) return 0.82;
  if (n <= 8) return 0.68;
  if (n <= 15) return 0.58;
  return 0.5;
}

export function drawSquad(ctx: CanvasRenderingContext2D, squad: Squad, camX: number): void {
  const members = squad.pool.active.slice().sort((a, b) => {
    const sa = squad.slotOf(a.slot);
    const sb = squad.slotOf(b.slot);
    return sa.z - sb.z;
  });
  const weapon = squad.weapon === "smg" ? "smg" : "pistol";
  const vis = squadVisualScale(squad.count);
  for (const s of members) {
    const slot = squad.slotOf(s.slot);
    const p = pr(squad.x + slot.x, 0, squad.z + slot.z, camX);
    drawSoldier(ctx, p.sx, p.sy, p.scale * vis, s.bob, s.flash, weapon);
  }
}

export function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet, camX: number): void {
  const p = pr(b.x, b.y, b.z, camX);
  const boosted = b.amplified;
  const k = p.scale * (boosted ? 1.35 : 1);
  ctx.save();
  ctx.translate(p.sx, p.sy);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 10 * k);
  glow.addColorStop(0, boosted ? "rgba(255,230,120,0.9)" : "rgba(255,240,170,0.7)");
  glow.addColorStop(1, "rgba(255,220,80,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 10 * k, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = boosted ? "#FFD24A" : "#F7E08A";
  ctx.beginPath();
  ctx.ellipse(0, 0, 3.2 * k, 8 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFF8D2";
  ctx.beginPath();
  ctx.ellipse(0, -2 * k, 1.6 * k, 3.2 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawParticle(ctx: CanvasRenderingContext2D, p: Particle, camX: number): void {
  const s = pr(p.x, Math.max(0, p.y), p.z, camX);
  const t = p.life / p.maxLife;
  ctx.save();
  ctx.globalAlpha = Math.max(0, t);
  ctx.fillStyle = p.color;
  const sz = p.size * s.scale * (p.kind === "puff" ? 1.4 - t * 0.4 : 1);
  if (p.kind === "puff") {
    ctx.beginPath();
    ctx.arc(s.sx, s.sy, Math.max(1, sz), 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = t > 0.5 ? "#FFE27A" : "#F6F1A8";
    drawStar(ctx, s.sx, s.sy, 5, Math.max(2, sz * 1.15), Math.max(1, sz * 0.45));
    ctx.fill();
  }
  ctx.restore();
}

export interface HudInfo {
  count: number;
  weapon: "pistol" | "smg";
  weaponTime: number;
  remain: number;
  fireBonus: number;
  muted: boolean;
  hint: boolean;
  warning?: { lane: "left" | "right"; timeLeft: number } | null;
}

export function drawHud(ctx: CanvasRenderingContext2D, hud: HudInfo): void {
  // 左：头像 + 人数
  const px = 70;
  const py = 78;
  ctx.save();
  ctx.beginPath();
  ctx.arc(px, py, 40, 0, Math.PI * 2);
  ctx.fillStyle = "#EFE4C8";
  ctx.fill();
  if (!drawSprite(ctx, "hud_portrait", px, py + 40, 84)) {
    ctx.fillStyle = "#6B7F3A";
    ctx.beginPath();
    ctx.arc(px, py, 34, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  pill(ctx, 118, 52, 126, 52, "rgba(255,248,230,0.94)");
  ctx.fillStyle = "#5A3E22";
  ctx.font = 'bold 30px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("× " + hud.count, 132, 80);

  // 中：武器药丸（冲锋枪只显示剩余秒数，不画弹药格）
  const wname = WEAPONS[hud.weapon].name;
  const extra = hud.weapon === "smg" ? "  " + Math.ceil(Math.max(0, hud.weaponTime)) + "s" : "";
  const midW = 230;
  const midX = (CANVAS_W - midW) / 2;
  pill(ctx, midX, 48, midW, 60, hud.weapon === "smg" ? "rgba(255,236,190,0.96)" : "rgba(255,248,230,0.94)");
  const iconId: SpriteId = hud.weapon === "smg" ? "icon_smg" : "icon_pistol";
  drawSprite(ctx, iconId, midX + 36, 108, 36);
  ctx.fillStyle = "#5A3E22";
  ctx.font = 'bold 24px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(wname + extra, midX + 62, 79);

  // 右：已坚持时间
  pill(ctx, CANVAS_W - 206, 48, 172, 60, "rgba(255,248,230,0.94)");
  drawClockIcon(ctx, CANVAS_W - 178, 78, 13);
  ctx.fillStyle = "#5A3E22";
  ctx.font = 'bold 28px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(formatTime(hud.remain), CANVAS_W - 112, 79);

  if (hud.fireBonus > 0) {
    pill(ctx, 36, 122, 200, 36, "rgba(86,160,90,0.94)");
    ctx.fillStyle = "#FFFFFF";
    ctx.font = 'bold 18px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("射速提升 " + hud.fireBonus.toFixed(1) + "s", 52, 141);
  }

  drawMute(ctx, hud.muted);

  if (hud.hint) {
    pill(ctx, 70, CANVAS_H - 210, CANVAS_W - 140, 72, "rgba(40,32,24,0.72)");
    ctx.fillStyle = "#FFFFFF";
    ctx.font = 'bold 22px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("左右滑动 · 自动开火 · 穿蓝门加人", CANVAS_W / 2, CANVAS_H - 172);
  }

  if (hud.warning) {
    const pulse = 0.72 + Math.sin(hud.warning.timeLeft * 18) * 0.18;
    pill(ctx, 150, 150, CANVAS_W - 300, 84, `rgba(180,36,32,${pulse})`);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = 'bold 44px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("躲开！", CANVAS_W / 2, 194);
  }
}

function pill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = "rgba(90,60,30,0.12)";
  roundRect(ctx, x, y + 3, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
}

function drawClockIcon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.save();
  ctx.strokeStyle = "#5A3E22";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - r * 0.55);
  ctx.moveTo(x, y);
  ctx.lineTo(x + r * 0.4, y + r * 0.15);
  ctx.stroke();
  ctx.restore();
}

export function hitMute(x: number, y: number): boolean {
  const dx = x - (CANVAS_W - 56);
  const dy = y - 150;
  return dx * dx + dy * dy <= 26 * 26;
}

export function drawMute(ctx: CanvasRenderingContext2D, muted: boolean): void {
  ctx.fillStyle = "rgba(255,248,230,0.92)";
  ctx.beginPath();
  ctx.arc(CANVAS_W - 56, 150, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(90,60,30,0.2)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#5A3E22";
  ctx.font = '16px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(muted ? "静音" : "音效", CANVAS_W - 56, 151);
}

export function drawTitle(
  ctx: CanvasRenderingContext2D,
  best: { kills: number; peakCount: number; time: number },
  muted = false,
): void {
  dim(ctx);
  drawMute(ctx, muted);
  ctx.fillStyle = "rgba(255,248,230,0.96)";
  roundRect(ctx, 80, 280, CANVAS_W - 160, 520, 28);
  ctx.fill();

  ctx.fillStyle = "#5A3E22";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = 'bold 58px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
  ctx.fillText("路口火力", CANVAS_W / 2, 380);
  ctx.font = '22px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillStyle = "rgba(90,62,34,0.8)";
  ctx.fillText("自动开火 · 穿门集结", CANVAS_W / 2, 430);

  drawButton(ctx, CANVAS_W / 2 - 140, 560, 280, 80, "#6B8F3A", "开始游戏");

  ctx.fillStyle = "rgba(90,62,34,0.8)";
  ctx.font = '20px "PingFang SC","Microsoft YaHei",sans-serif';
  if (best.kills > 0 || best.peakCount > 0) {
    ctx.fillText(
      "最高击杀 " + best.kills + "  ·  最高人数 " + best.peakCount + "  ·  最长坚持 " + formatTime(best.time),
      CANVAS_W / 2,
      700,
    );
  } else {
    ctx.fillText("本地记录将在本机保存", CANVAS_W / 2, 700);
  }

  ctx.font = '18px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillStyle = "rgba(255,248,230,0.86)";
  ctx.fillText("隐私政策  |  适龄提示", CANVAS_W / 2, CANVAS_H - 80);
}

export function titleHit(x: number, y: number): "start" | "legal" | null {
  if (x >= CANVAS_W / 2 - 140 && x <= CANVAS_W / 2 + 140 && y >= 560 && y <= 640) return "start";
  if (y >= CANVAS_H - 110 && y <= CANVAS_H - 50) return "legal";
  return null;
}

export function drawLegal(ctx: CanvasRenderingContext2D): void {
  dim(ctx);
  ctx.fillStyle = "rgba(255,248,230,0.97)";
  roundRect(ctx, 70, 280, CANVAS_W - 140, 640, 22);
  ctx.fill();
  ctx.fillStyle = "#5A3E22";
  ctx.textAlign = "center";
  ctx.font = 'bold 30px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText("隐私政策与适龄提示", CANVAS_W / 2, 350);
  ctx.font = '20px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillStyle = "rgba(90,62,34,0.88)";
  const lines = [
    "本页为占位说明，正式上架前将替换为完整文案。",
    "本游戏为休闲射击，适合 12 岁及以上玩家。",
    "不收集个人身份信息，成绩仅保存在本地。",
    "不含内购。广告能力本版本关闭。",
    "请合理安排游戏时间。",
  ];
  let y = 420;
  for (const line of lines) {
    wrapText(ctx, line, CANVAS_W / 2, y, CANVAS_W - 220, 32);
    y += 70;
  }
  drawButton(ctx, CANVAS_W / 2 - 110, 800, 220, 64, "#6B8F3A", "返回");
}

export function legalHit(x: number, y: number): boolean {
  return x >= CANVAS_W / 2 - 110 && x <= CANVAS_W / 2 + 110 && y >= 800 && y <= 864;
}

export function drawResult(
  ctx: CanvasRenderingContext2D,
  kills: number,
  time: number,
  peak: number,
  best: { kills: number; peakCount: number; time: number },
): void {
  dim(ctx);
  ctx.fillStyle = "rgba(255,248,230,0.96)";
  roundRect(ctx, 80, 250, CANVAS_W - 160, 620, 28);
  ctx.fill();
  ctx.fillStyle = "#5A3E22";
  ctx.textAlign = "center";
  ctx.font = 'bold 48px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText("本局结束", CANVAS_W / 2, 340);
  ctx.font = '22px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillStyle = "rgba(90,62,34,0.85)";
  ctx.fillText("人数归零 · 比比谁坚持得更久", CANVAS_W / 2, 400);

  const rows = [
    ["坚持时间", formatTime(time)],
    ["击杀", String(kills)],
    ["本局最高人数", String(peak)],
    ["最长坚持", formatTime(best.time)],
    ["历史最高击杀", String(best.kills)],
    ["历史最高人数", String(best.peakCount)],
  ];
  let y = 470;
  ctx.font = '22px "PingFang SC","Microsoft YaHei",sans-serif';
  for (const [k, v] of rows) {
    ctx.fillStyle = "rgba(90,62,34,0.65)";
    ctx.textAlign = "left";
    ctx.fillText(k, 200, y);
    ctx.fillStyle = "#5A3E22";
    ctx.textAlign = "right";
    ctx.fillText(v, CANVAS_W - 200, y);
    y += 44;
  }

  drawButton(ctx, CANVAS_W / 2 - 140, 740, 280, 80, "#6B8F3A", "再来一局");
}

export function resultHit(x: number, y: number): boolean {
  return x >= CANVAS_W / 2 - 140 && x <= CANVAS_W / 2 + 140 && y >= 740 && y <= 820;
}

function drawButton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  label: string,
): void {
  ctx.fillStyle = "rgba(90,60,30,0.16)";
  roundRect(ctx, x, y + 4, w, h, 20);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, 20);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = 'bold 32px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + h / 2 + 2);
}

function dim(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(30,22,16,0.48)";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
): void {
  const chars = text.split("");
  let line = "";
  let yy = y;
  ctx.textAlign = "center";
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW) {
      ctx.fillText(line, x, yy);
      line = ch;
      yy += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

