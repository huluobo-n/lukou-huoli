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
  CAGE_LABEL,
  SPAWN_Z,
  TEAM_Z,
  WEAPONS,
  type SceneId,
  type WeaponId,
} from "./config";
import { legalParagraphs, type LegalPage } from "./legal";
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
const NIGHT_TREE_ZS = [18, 29, 48, 67, 86];
const NIGHT_HOUSE_ZS = [14, 21, 31, 41, 50, 61, 73, 88];
const FORK_HOUSE_ZS = [16, 28, 40, 55, 69, 84];

function isNight(scene: SceneId): boolean {
  return scene === "night" || scene === "fork" || scene === "storm";
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  camX: number,
  time: number,
  shakeX: number,
  shakeY: number,
  scene: SceneId = "day",
  hold = false,
  flood = false,
): void {
  ctx.save();
  ctx.translate(shakeX, shakeY);

  drawSky(ctx, camX, scene);

  const grass = ctx.createLinearGradient(0, HORIZON_Y, 0, CANVAS_H);
  if (scene === "storm" || scene === "fork") {
    grass.addColorStop(0, scene === "storm" ? "#1A2438" : "#2E3A4E");
    grass.addColorStop(0.45, scene === "storm" ? "#152033" : "#243446");
    grass.addColorStop(1, scene === "storm" ? "#121A28" : "#1C2A38");
  } else if (scene === "night") {
    grass.addColorStop(0, "#3A4A5A");
    grass.addColorStop(0.45, "#2C3C3A");
    grass.addColorStop(1, "#24342C");
  } else {
    grass.addColorStop(0, "#C8C49A");
    grass.addColorStop(0.4, "#B3B880");
    grass.addColorStop(1, "#8EA86A");
  }
  ctx.fillStyle = grass;
  ctx.fillRect(0, HORIZON_Y + 6, CANVAS_W, CANVAS_H - HORIZON_Y);

  drawRoad(ctx, camX, time, scene);
  if (isNight(scene)) drawCrossAlley(ctx, camX, time);
  if (scene === "fork") drawForkPlaza(ctx, camX, time, hold);
  if (flood) drawFloodMid(ctx, camX, time);
  drawRoadside(ctx, camX, time, scene);
  if (isNight(scene)) drawLamps(ctx, camX, time);
  if (scene === "storm") drawRain(ctx, time);

  ctx.restore();
}

function drawSky(ctx: CanvasRenderingContext2D, camX: number, scene: SceneId = "day"): void {
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
  if (isNight(scene)) {
    ctx.fillStyle = scene === "storm"
      ? "rgba(6, 10, 28, 0.7)"
      : scene === "fork"
        ? "rgba(10, 16, 40, 0.62)"
        : "rgba(18, 24, 48, 0.55)";
    ctx.fillRect(0, 0, CANVAS_W, horizon + 24);
    // 几颗小星星
    ctx.fillStyle = "rgba(255,245,210,0.8)";
    for (let i = 0; i < 14; i++) {
      const sx = (i * 97 + 40) % CANVAS_W;
      const sy = 24 + (i * 37) % 220;
      ctx.beginPath();
      ctx.arc(sx, sy, i % 3 === 0 ? 2.1 : 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawRoad(ctx: CanvasRenderingContext2D, camX: number, time: number, scene: SceneId = "day"): void {
  const far = pr(-ROAD_HALF, 0, SPAWN_Z + 10, camX);
  const farR = pr(ROAD_HALF, 0, SPAWN_Z + 10, camX);
  const near = pr(-ROAD_HALF, 0, 8.5, camX);
  const nearR = pr(ROAD_HALF, 0, 8.5, camX);

  ctx.fillStyle = scene === "storm" ? "#2E3848" : isNight(scene) ? "#4A5160" : "#8E9198";
  ctx.beginPath();
  ctx.moveTo(far.sx, far.sy);
  ctx.lineTo(farR.sx, farR.sy);
  ctx.lineTo(nearR.sx, nearR.sy);
  ctx.lineTo(near.sx, near.sy);
  ctx.closePath();
  ctx.fill();

  // 路边石
  ctx.fillStyle = isNight(scene) ? "#8A8070" : "#D9CDB6";
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
  if (scene === "day") {
    drawDashLine(ctx, 0, camX, "#F3EEDC", 7, time);
  } else if (scene === "night") {
    // 夜路口改成双向分隔带，不再是同一条居中虚线
    drawMedian(ctx, camX, 0.7, "#5C6574");
    drawDashLine(ctx, -2.15, camX, "#D6C98A", 5, time);
    drawDashLine(ctx, 2.15, camX, "#D6C98A", 5, time);
  } else if (scene === "fork") {
    drawMedian(ctx, camX, 1.35, "#6A5A3A");
    drawDashLine(ctx, -2.55, camX, "#E8D48A", 5, time);
    drawDashLine(ctx, 2.55, camX, "#E8D48A", 5, time);
    drawDashLine(ctx, 0, camX, "#F4E7B0", 6, time);
  } else {
    // 雨夜：湿路面高光，中央不再是岔路口岛
    drawDashLine(ctx, -2.4, camX, "#8EC4E0", 4, time);
    drawDashLine(ctx, 2.4, camX, "#8EC4E0", 4, time);
  }
}

function drawMedian(ctx: CanvasRenderingContext2D, camX: number, half: number, color: string): void {
  const farL = pr(-half, 0.02, SPAWN_Z + 10, camX);
  const farR = pr(half, 0.02, SPAWN_Z + 10, camX);
  const nearL = pr(-half, 0.02, 8.5, camX);
  const nearR = pr(half, 0.02, 8.5, camX);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(farL.sx, farL.sy);
  ctx.lineTo(farR.sx, farR.sy);
  ctx.lineTo(nearR.sx, nearR.sy);
  ctx.lineTo(nearL.sx, nearL.sy);
  ctx.closePath();
  ctx.fill();
}


function drawFloodMid(ctx: CanvasRenderingContext2D, camX: number, time: number): void {
  const half = 1.35;
  const farL = pr(-half, 0.05, SPAWN_Z + 8, camX);
  const farR = pr(half, 0.05, SPAWN_Z + 8, camX);
  const nearL = pr(-half, 0.05, 8.5, camX);
  const nearR = pr(half, 0.05, 8.5, camX);
  const pulse = 0.34 + 0.08 * Math.sin(time * 7);
  ctx.fillStyle = "rgba(40, 90, 150, " + pulse.toFixed(3) + ")";
  ctx.beginPath();
  ctx.moveTo(farL.sx, farL.sy);
  ctx.lineTo(farR.sx, farR.sy);
  ctx.lineTo(nearR.sx, nearR.sy);
  ctx.lineTo(nearL.sx, nearL.sy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(160, 210, 255, 0.28)";
  for (let i = 0; i < 6; i++) {
    const z = 12 + ((time * 10 + i * 7) % 36);
    const a = pr(-half + 0.15, 0.08, z, camX);
    const b = pr(half - 0.15, 0.08, z + 1.1, camX);
    ctx.globalAlpha = 0.35 + 0.2 * Math.sin(time * 5 + i);
    ctx.beginPath();
    ctx.ellipse((a.sx + b.sx) / 2, (a.sy + b.sy) / 2, Math.max(8, (b.sx - a.sx) * 0.28), Math.max(3, a.scale * 3.5), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawForkPlaza(ctx: CanvasRenderingContext2D, camX: number, time: number, hold: boolean): void {
  const z = wrapZ(30, time * 0.08, 18, 50);
  const tip = pr(0, 0.04, z + 6, camX);
  const left = pr(-3.4, 0.04, z - 1.5, camX);
  const right = pr(3.4, 0.04, z - 1.5, camX);
  ctx.fillStyle = hold ? "rgba(232, 200, 90, 0.42)" : "rgba(160, 140, 90, 0.35)";
  ctx.beginPath();
  ctx.moveTo(tip.sx, tip.sy);
  ctx.lineTo(left.sx, left.sy);
  ctx.lineTo(right.sx, right.sy);
  ctx.closePath();
  ctx.fill();
  if (hold) {
    ctx.fillStyle = "rgba(255, 220, 110, 0.22)";
    const a = pr(-1.2, 0.03, SPAWN_Z + 6, camX);
    const b = pr(1.2, 0.03, SPAWN_Z + 6, camX);
    const c = pr(1.2, 0.03, 9, camX);
    const d = pr(-1.2, 0.03, 9, camX);
    ctx.beginPath();
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(b.sx, b.sy);
    ctx.lineTo(c.sx, c.sy);
    ctx.lineTo(d.sx, d.sy);
    ctx.closePath();
    ctx.fill();
  }
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

function drawCrossAlley(ctx: CanvasRenderingContext2D, camX: number, time: number): void {
  const z = wrapZ(38, time * 0.15, 22, 52);
  const half = ROAD_HALF + 7.5;
  const near = pr(-half, 0, z - 2.2, camX);
  const far = pr(-half, 0, z + 2.2, camX);
  const nearR = pr(half, 0, z - 2.2, camX);
  const farR = pr(half, 0, z + 2.2, camX);
  ctx.fillStyle = "#3E4552";
  ctx.beginPath();
  ctx.moveTo(far.sx, far.sy);
  ctx.lineTo(farR.sx, farR.sy);
  ctx.lineTo(nearR.sx, nearR.sy);
  ctx.lineTo(near.sx, near.sy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(214,201,138,0.55)";
  const a = pr(-1.1, 0.02, z - 1.5, camX);
  const b = pr(-1.1, 0.02, z + 1.5, camX);
  const c = pr(1.1, 0.02, z + 1.5, camX);
  const d = pr(1.1, 0.02, z - 1.5, camX);
  ctx.beginPath();
  ctx.moveTo(a.sx, a.sy);
  ctx.lineTo(b.sx, b.sy);
  ctx.lineTo(c.sx, c.sy);
  ctx.lineTo(d.sx, d.sy);
  ctx.closePath();
  ctx.fill();
}

function drawLamps(ctx: CanvasRenderingContext2D, camX: number, time: number): void {
  const zs = [16, 26, 36, 46, 56, 68];
  for (let i = 0; i < zs.length; i++) {
    const z = wrapZ(zs[i], time, 12, 80);
    for (const side of [-1, 1] as const) {
      const x = side * (ROAD_HALF + 1.15);
      const q = pr(x, 0, z, camX);
      const k = q.scale;
      if (k < 0.08) continue;
      ctx.save();
      ctx.translate(q.sx, q.sy);
      ctx.fillStyle = "#2A2E38";
      ctx.fillRect(-1.6 * k, -70 * k, 3.2 * k, 70 * k);
      ctx.fillStyle = "rgba(255, 210, 120, 0.18)";
      ctx.beginPath();
      ctx.ellipse(0, -72 * k, 28 * k, 16 * k, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFE6A0";
      ctx.beginPath();
      ctx.arc(0, -72 * k, 5 * k, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}


function drawRain(ctx: CanvasRenderingContext2D, time: number): void {
  ctx.save();
  ctx.strokeStyle = "rgba(190, 215, 235, 0.28)";
  ctx.lineWidth = 1.2;
  const off = (time * 420) % 90;
  for (let i = 0; i < 42; i++) {
    const x = ((i * 73 + 18) % 720) + 8;
    const y = ((i * 97 + off * 3) % 1100) + 160;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 7, y + 28);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRoadside(ctx: CanvasRenderingContext2D, camX: number, time: number, scene: SceneId = "day"): void {
  type Prop = { kind: "tree" | "house"; side: -1 | 1; z: number; variant: number };
  const props: Prop[] = [];
  const trees = scene === "day" ? TREE_ZS : scene === "night" ? NIGHT_TREE_ZS : [];
  const houses = scene === "day" ? HOUSE_ZS : scene === "night" ? NIGHT_HOUSE_ZS : FORK_HOUSE_ZS;
  const treeSpan = scene === "night" ? 100 : 92;
  const houseSpan = scene === "fork" || scene === "storm" ? 102 : 94;
  for (let i = 0; i < trees.length; i++) {
    props.push({ kind: "tree", side: -1, z: wrapZ(trees[i], time, 11, treeSpan), variant: i % 2 });
    if (scene === "day") {
      props.push({ kind: "tree", side: 1, z: wrapZ(trees[i] + 3.4, time, 11, treeSpan), variant: (i + 1) % 2 });
    }
  }
  for (let i = 0; i < houses.length; i++) {
    const off = scene === "night" ? 7.2 : scene === "fork" || scene === "storm" ? 9.0 : 5.5;
    props.push({ kind: "house", side: -1, z: wrapZ(houses[i] + (scene === "storm" ? 3.1 : 0), time, 14, houseSpan), variant: scene === "day" ? i % 4 : (i + (scene === "storm" ? 3 : 1)) % 4 });
    props.push({ kind: "house", side: 1, z: wrapZ(houses[i] + off, time, 14, houseSpan), variant: (i + 2) % 4 });
  }
  const alleyZ = isNight(scene) ? wrapZ(38, time * 0.15, 22, 52) : -99;
  props.sort((a, b) => b.z - a.z);
  for (const p of props) {
    if (Math.abs(p.z - alleyZ) < 4.5) continue;
    if (p.kind === "tree") {
      const x = p.side < 0 ? -ROAD_HALF - 1.85 : ROAD_HALF + 1.9;
      const q = pr(x, 0, p.z, camX);
      const k = q.scale;
      if (k < 0.08) continue;
      const id: SpriteId = p.variant === 0 ? "tree_0" : "tree_1";
      drawSprite(ctx, id, q.sx, q.sy + 4 * k, 170 * k, { flip: p.side > 0 });
    } else {
      const inset = scene === "fork" || scene === "storm" ? 5.6 : scene === "night" ? 3.55 : 4.35;
      const x = p.side < 0 ? -ROAD_HALF - inset : ROAD_HALF + inset + 0.1;
      const q = pr(x, 0, p.z, camX);
      const k = q.scale;
      if (k < 0.08) continue;
      const id = ("house_" + p.variant) as SpriteId;
      const h = scene === "night" ? 250 * k : scene === "fork" || scene === "storm" ? 260 * k : 230 * k;
      drawSprite(ctx, id, q.sx, q.sy + 6 * k, h, { flip: p.side > 0 });
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

function drawEnemyLabel(ctx: CanvasRenderingContext2D, text: string, k: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.max(11, 15 * k)}px "PingFang SC","Microsoft YaHei",sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, y);
}

function drawSpecialEnemy(ctx: CanvasRenderingContext2D, e: Enemy, k: number, flash: number): void {
  if (e.type === "shield") {
    clayBody(ctx, k, flash, "#6A7B8A", 26, 52, 16, 60);
    ctx.fillStyle = flash > 0 ? "#FFFFFF" : "#C9D4E6";
    roundRect(ctx, -28 * k, -62 * k, 34 * k, 54 * k, 8 * k);
    ctx.fill();
    ctx.strokeStyle = "rgba(50,70,100,0.55)";
    ctx.lineWidth = Math.max(2, 3.2 * k);
    roundRect(ctx, -28 * k, -62 * k, 34 * k, 54 * k, 8 * k);
    ctx.stroke();
    ctx.fillStyle = flash > 0 ? "#FFFFFF" : "#8FA4C8";
    ctx.beginPath();
    ctx.arc(-10 * k, -38 * k, 9 * k, 0, Math.PI * 2);
    ctx.fill();
    drawEnemyLabel(ctx, "盾", k, -78 * k, "#2C3A52");
    return;
  }
  if (e.type === "bomber") {
    clayBody(ctx, k, flash, "#D46A28", 28, 50, 15, 54);
    ctx.fillStyle = flash > 0 ? "#FFFFFF" : "#5A3A28";
    ctx.beginPath();
    ctx.arc(0, -20 * k, 15 * k, 0, Math.PI * 2);
    ctx.fill();
    const pulse = 0.6 + Math.sin(e.age * 10) * 0.4;
    ctx.fillStyle = `rgba(255, 80, 40, ${0.35 + pulse * 0.35})`;
    ctx.beginPath();
    ctx.arc(0, -20 * k, 18 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#C9A15A";
    ctx.fillRect(-2.4 * k, -40 * k, 4.8 * k, 10 * k);
    ctx.fillStyle = pulse > 0.7 ? "#FFF3A0" : "#FF6A2A";
    ctx.beginPath();
    ctx.arc(0, -44 * k, 4 * k, 0, Math.PI * 2);
    ctx.fill();
    drawEnemyLabel(ctx, "爆", k, -78 * k, "#7A2A10");
    return;
  }
  if (e.type === "splitter" || e.type === "splitling") {
    const chubby = e.type === "splitling" ? 0.85 : 1;
    clayBody(ctx, k * chubby, flash, "#7ECFC0", 26, 46, 14, 54);
    ctx.strokeStyle = "#2A5A52";
    ctx.lineWidth = Math.max(1.6, 2.6 * k);
    ctx.beginPath();
    ctx.moveTo(0, -8 * k);
    ctx.lineTo(-4 * k, -58 * k);
    ctx.stroke();
    if (e.type === "splitter") {
      ctx.fillStyle = flash > 0 ? "#FFFFFF" : "#5BB8A8";
      ctx.beginPath();
      ctx.arc(18 * k, -52 * k, 13 * k, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-14 * k, -56 * k, 11 * k, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.beginPath();
      ctx.ellipse(15 * k, -56 * k, 3.5 * k, 2.4 * k, -0.4, 0, Math.PI * 2);
      ctx.fill();
      drawEnemyLabel(ctx, "裂", k, -80 * k, "#1F4A44");
    }
    return;
  }
  if (e.type === "jumper") {
    if (e.airborne) {
      ctx.fillStyle = "rgba(40,50,30,0.2)";
      drawEllipse(ctx, 0, 8 * k, 20 * k, 6 * k);
      ctx.fill();
    }
    clayBody(ctx, k, flash, "#C6E14A", 16, 40, 13, 62);
    ctx.fillStyle = flash > 0 ? "#FFFFFF" : "#8FB030";
    // 弹簧腿
    ctx.fillRect(-10 * k, -22 * k, 6 * k, 24 * k);
    ctx.fillRect(4 * k, -22 * k, 6 * k, 24 * k);
    ctx.strokeStyle = "#5A7A18";
    ctx.lineWidth = Math.max(1.4, 2 * k);
    for (const side of [-7, 7]) {
      ctx.beginPath();
      ctx.moveTo(side * k, -20 * k);
      for (let i = 1; i <= 4; i++) ctx.lineTo((side + (i % 2 === 0 ? 3 : -3)) * k, (-20 + i * 5) * k);
      ctx.stroke();
    }
    drawEnemyLabel(ctx, "跳", k, -84 * k, "#3E5A10");
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
  lane: "left" | "right" | "mid",
  camX: number,
  timeLeft: number,
  kind: "warn" | "rush" | "alley" | "hold" = "warn",
): void {
  const x = lane === "mid" ? 0 : lane === "left" ? -LANE_X : LANE_X;
  const farL = pr(x - 2.4, 0, SPAWN_Z - 4, camX);
  const farR = pr(x + 2.4, 0, SPAWN_Z - 4, camX);
  const nearL = pr(x - 2.4, 0, 10, camX);
  const nearR = pr(x + 2.4, 0, 10, camX);
  const pulse = 0.18 + Math.max(0, 1.2 - timeLeft) * 0.16 + Math.sin(timeLeft * 16) * 0.05;
  const alpha = Math.max(0.12, Math.min(0.42, pulse));
  ctx.save();
  ctx.fillStyle = kind === "rush"
    ? `rgba(210, 128, 32, ${alpha})`
    : kind === "alley"
      ? `rgba(120, 80, 200, ${alpha})`
      : kind === "hold"
        ? `rgba(230, 190, 70, ${alpha + 0.08})`
        : `rgba(210, 48, 40, ${alpha})`;
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
    ctx.fillStyle = "#2E6A28";
    ctx.font = `bold ${Math.max(12, 18 * k)}px "PingFang SC","Microsoft YaHei",sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(CAGE_LABEL, 0, -86 * k);
    ctx.font = `bold ${Math.max(9, 13 * k)}px "PingFang SC","Microsoft YaHei",sans-serif`;
    ctx.fillStyle = "#5A3E22";
    ctx.fillText(Math.max(0, Math.ceil(p.hp)) + "/" + Math.ceil(p.maxHp), 0, -70 * k);
    drawPropHp(ctx, p, 36 * k, k);
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
  const w = 44 * k;
  const h = 7 * k;
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
  weapon: WeaponId,
): void {
  const k = scale;
  const bounce = Math.sin(bob) * 2.6 * k;
  const frame = Math.sin(bob) >= 0 ? 0 : 1;
  const id: SpriteId = weapon === "pistol"
    ? (frame === 0 ? "soldier_pistol_0" : "soldier_pistol_1")
    : (frame === 0 ? "soldier_smg_0" : "soldier_smg_1");

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
  const rate = weapon === "smg" ? 7.2 : weapon === "heavy" ? 2.4 : 3.4;
  if (Math.sin(bob * rate) > 0.55) {
    const mz = muzzleOf(id);
    const mx = (mz[0] - 0.5) * size.w;
    const my = -h + mz[1] * h;
    drawMuzzleFlash(ctx, mx, my, k * (weapon === "heavy" ? 1.45 : weapon === "smg" ? 1.15 : 1));
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
  const weapon: WeaponId = squad.weapon;
  const vis = squadVisualScale(squad.count);
  for (const s of members) {
    const slot = squad.slotOf(s.slot);
    const p = pr(squad.x + slot.x, 0, squad.z + slot.z, camX);
    drawSoldier(ctx, p.sx, p.sy, p.scale * vis, s.bob, s.flash, weapon);
    if (squad.shielded) {
      ctx.save();
      ctx.strokeStyle = "rgba(90, 170, 230, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.sx, p.sy - 28 * p.scale * vis, 22 * p.scale * vis, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

export function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet, camX: number): void {
  const p = pr(b.x, b.y, b.z, camX);
  const boosted = b.amplified;
  const heavy = b.heavy;
  const k = p.scale * (heavy ? 1.7 : boosted ? 1.35 : 1);
  ctx.save();
  ctx.translate(p.sx, p.sy);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, (heavy ? 14 : 10) * k);
  glow.addColorStop(0, heavy ? "rgba(255,140,70,0.95)" : boosted ? "rgba(255,230,120,0.9)" : "rgba(255,240,170,0.7)");
  glow.addColorStop(1, "rgba(255,220,80,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, (heavy ? 13 : 10) * k, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = heavy ? "#FF8A3A" : boosted ? "#FFD24A" : "#F7E08A";
  ctx.beginPath();
  ctx.ellipse(0, 0, (heavy ? 5.2 : 3.2) * k, (heavy ? 11 : 8) * k, 0, 0, Math.PI * 2);
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
  weapon: WeaponId;
  weaponTime: number;
  remain: number;
  fireBonus: number;
  muted: boolean;
  hint: boolean;
  kills?: number;
  shieldTime?: number;
  warning?: { lane: "left" | "right"; timeLeft: number } | null;
  rush?: { timeLeft: number; spawned: boolean } | null;
  banner?: string | null;
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
  const extra = hud.weapon !== "pistol" ? "  " + Math.ceil(Math.max(0, hud.weaponTime)) + "s" : "";
  const midW = 230;
  const midX = (CANVAS_W - midW) / 2;
  const wcolor = hud.weapon === "heavy" ? "rgba(255,214,170,0.96)" : hud.weapon === "smg" ? "rgba(255,236,190,0.96)" : "rgba(255,248,230,0.94)";
  pill(ctx, midX, 48, midW, 60, wcolor);
  const iconId: SpriteId = hud.weapon === "pistol" ? "icon_pistol" : "icon_smg";
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

  pill(ctx, CANVAS_W - 206, 118, 172, 36, "rgba(255,248,230,0.94)");
  ctx.fillStyle = "#5A3E22";
  ctx.font = 'bold 18px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("击杀 " + (hud.kills ?? 0), CANVAS_W - 120, 137);

  if (hud.fireBonus > 0) {
    pill(ctx, 36, 122, 200, 36, "rgba(86,160,90,0.94)");
    ctx.fillStyle = "#FFFFFF";
    ctx.font = 'bold 18px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("射速提升 " + hud.fireBonus.toFixed(1) + "s", 52, 141);
  }
  if (hud.shieldTime && hud.shieldTime > 0) {
    const y = hud.fireBonus > 0 ? 164 : 122;
    pill(ctx, 36, y, 200, 36, "rgba(70,140,200,0.94)");
    ctx.fillStyle = "#FFFFFF";
    ctx.font = 'bold 18px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("护盾 " + hud.shieldTime.toFixed(1) + "s", 52, y + 19);
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

  const banner = hud.banner || (hud.warning ? (hud.warning.lane === "left" ? "躲开左道！" : "躲开右道！") : hud.rush ? "左道来袭！" : null);
  if (banner) {
    const warn = banner.startsWith("躲开");
    const rush = banner.includes("来袭") || banner.includes("夹击");
    const pulse = 0.72 + Math.sin((hud.warning?.timeLeft ?? hud.rush?.timeLeft ?? 0.4) * 18) * 0.16;
    const color = warn ? `rgba(180,36,32,${pulse})` : rush ? `rgba(196,110,24,${pulse})` : banner.includes("×2") ? `rgba(196,150,24,${pulse})` : `rgba(70,80,150,${pulse})`;
    pill(ctx, 90, 164, CANVAS_W - 180, 84, color);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = 'bold 40px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(banner, CANVAS_W / 2, 208);
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

const LEGAL_BACK_Y = CANVAS_H - 132;
const LEGAL_LINK_Y = CANVAS_H - 214;

export function legalMaxScroll(page: LegalPage): number {
  const { lines } = legalParagraphs(page);
  const charsPerLine = page === "summary" ? 16 : 20;
  let h = 0;
  for (const para of lines) {
    const rows = Math.max(1, Math.ceil(para.length / charsPerLine));
    h += rows * 34 + 14;
  }
  const view = page === "summary" ? CANVAS_H - 430 : CANVAS_H - 360;
  return Math.max(0, h - view);
}

export function drawLegal(ctx: CanvasRenderingContext2D, page: LegalPage = "summary", scrollY = 0): void {
  dim(ctx);
  const boxY = 70;
  const boxH = CANVAS_H - 70 - 36;
  ctx.fillStyle = "rgba(255,248,230,0.97)";
  roundRect(ctx, 48, boxY, CANVAS_W - 96, boxH, 22);
  ctx.fill();

  const { title, lines } = legalParagraphs(page);
  ctx.fillStyle = "#5A3E22";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = 'bold 32px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText(title, CANVAS_W / 2, 128);

  const clipTop = 150;
  const clipBottom = page === "summary" ? LEGAL_LINK_Y - 16 : LEGAL_BACK_Y - 16;
  ctx.save();
  ctx.beginPath();
  ctx.rect(70, clipTop, CANVAS_W - 140, clipBottom - clipTop);
  ctx.clip();
  ctx.font = '20px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
  ctx.fillStyle = "rgba(90,62,34,0.9)";
  ctx.textAlign = "left";
  let y = clipTop + 28 + scrollY;
  const maxW = CANVAS_W - 200;
  for (const para of lines) {
    y = wrapTextLeft(ctx, para, 100, y, maxW, 32) + 14;
  }
  ctx.restore();

  if (page === "summary") {
    drawButton(ctx, 80, LEGAL_LINK_Y, 250, 58, "#6B8F3A", "隐私政策");
    drawButton(ctx, CANVAS_W - 80 - 250, LEGAL_LINK_Y, 250, 58, "#6B8F3A", "适龄提示");
  }
  drawButton(ctx, CANVAS_W / 2 - 110, LEGAL_BACK_Y, 220, 64, "#6B8F3A", "返回");
}

export function legalHit(x: number, y: number, page: LegalPage = "summary"): "back" | "privacy" | "age" | null {
  if (x >= CANVAS_W / 2 - 110 && x <= CANVAS_W / 2 + 110 && y >= LEGAL_BACK_Y && y <= LEGAL_BACK_Y + 64) return "back";
  if (page === "summary") {
    if (x >= 80 && x <= 330 && y >= LEGAL_LINK_Y && y <= LEGAL_LINK_Y + 58) return "privacy";
    if (x >= CANVAS_W - 80 - 250 && x <= CANVAS_W - 80 && y >= LEGAL_LINK_Y && y <= LEGAL_LINK_Y + 58) return "age";
  }
  return null;
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

function wrapTextLeft(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
): number {
  const chars = text.split("");
  let line = "";
  let yy = y;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = ch;
      yy += lineH;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, yy);
    yy += lineH;
  }
  return yy;
}

