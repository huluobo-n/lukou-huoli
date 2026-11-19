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
  RUN_DURATION,
  SPAWN_Z,
  TEAM_Z,
  WEAPONS,
} from "./config";
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

const TREE_ZS = [20, 26, 32, 38, 44, 50, 56, 64, 72];
const LAMP_ZS = [23, 35, 47, 59];

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  camX: number,
  time: number,
  shakeX: number,
  shakeY: number,
): void {
  ctx.save();
  ctx.translate(shakeX, shakeY);

  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 80);
  sky.addColorStop(0, "#8FD3F4");
  sky.addColorStop(0.55, "#B9E4F8");
  sky.addColorStop(1, "#F8E6C8");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // 太阳
  ctx.fillStyle = "#FFE27A";
  ctx.beginPath();
  ctx.arc(560, 150, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,226,122,0.28)";
  ctx.beginPath();
  ctx.arc(560, 150, 78, 0, Math.PI * 2);
  ctx.fill();

  // 云
  drawCloud(ctx, 140, 110, 1, time);
  drawCloud(ctx, 400, 80, 0.8, time * 0.7 + 10);
  drawCloud(ctx, 620, 130, 0.7, time * 0.5 + 4);

  // 远山
  ctx.fillStyle = "#8BC4A0";
  ctx.beginPath();
  ctx.moveTo(0, HORIZON_Y + 8);
  ctx.quadraticCurveTo(160, HORIZON_Y - 70, 300, HORIZON_Y + 4);
  ctx.quadraticCurveTo(430, HORIZON_Y - 90, 560, HORIZON_Y + 6);
  ctx.quadraticCurveTo(650, HORIZON_Y - 40, 720, HORIZON_Y + 10);
  ctx.lineTo(720, HORIZON_Y + 40);
  ctx.lineTo(0, HORIZON_Y + 40);
  ctx.fill();
  ctx.fillStyle = "#6FA88A";
  ctx.beginPath();
  ctx.moveTo(0, HORIZON_Y + 22);
  ctx.quadraticCurveTo(220, HORIZON_Y - 20, 420, HORIZON_Y + 26);
  ctx.quadraticCurveTo(580, HORIZON_Y - 10, 720, HORIZON_Y + 28);
  ctx.lineTo(720, HORIZON_Y + 60);
  ctx.lineTo(0, HORIZON_Y + 60);
  ctx.fill();

  // 草地
  const grass = ctx.createLinearGradient(0, HORIZON_Y, 0, CANVAS_H);
  grass.addColorStop(0, "#8ED48A");
  grass.addColorStop(1, "#5EAE62");
  ctx.fillStyle = grass;
  ctx.fillRect(0, HORIZON_Y + 18, CANVAS_W, CANVAS_H - HORIZON_Y);

  drawRoad(ctx, camX, time);

  // 路边装饰由远到近，并随道路滚动
  const trees = TREE_ZS.map((z) => ({ side: -1 as const, z: wrapZ(z, time, 12, 76), s: 1 }))
    .concat(TREE_ZS.map((z) => ({ side: 1 as const, z: wrapZ(z + 3, time, 12, 76), s: 0.9 })))
    .sort((a, b) => b.z - a.z);
  for (const t of trees) {
    const x = t.side < 0 ? -ROAD_HALF - 2.2 : ROAD_HALF + 2.4;
    drawTree(ctx, x, t.z, camX, t.s);
  }
  const lamps = LAMP_ZS.map((z) => ({ side: -1 as const, z: wrapZ(z, time, 12, 76) }))
    .concat(LAMP_ZS.map((z) => ({ side: 1 as const, z: wrapZ(z + 6, time, 12, 76) })))
    .sort((a, b) => b.z - a.z);
  for (const l of lamps) {
    const x = l.side < 0 ? -ROAD_HALF - 1.2 : ROAD_HALF + 1.2;
    drawLamp(ctx, x, l.z, camX);
  }

  ctx.restore();
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number): void {
  const ox = (t * 4) % 40;
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  drawEllipse(ctx, x + ox, y, 46 * s, 22 * s);
  ctx.fill();
  drawEllipse(ctx, x + ox + 30 * s, y + 4, 32 * s, 18 * s);
  ctx.fill();
  drawEllipse(ctx, x + ox - 28 * s, y + 6, 28 * s, 16 * s);
  ctx.fill();
}

function drawRoad(ctx: CanvasRenderingContext2D, camX: number, time: number): void {
  const far = pr(-ROAD_HALF, 0, SPAWN_Z + 10, camX);
  const farR = pr(ROAD_HALF, 0, SPAWN_Z + 10, camX);
  const near = pr(-ROAD_HALF, 0, 8.5, camX);
  const nearR = pr(ROAD_HALF, 0, 8.5, camX);

  ctx.fillStyle = "#9AA3B2";
  ctx.beginPath();
  ctx.moveTo(far.sx, far.sy);
  ctx.lineTo(farR.sx, farR.sy);
  ctx.lineTo(nearR.sx, nearR.sy);
  ctx.lineTo(near.sx, near.sy);
  ctx.closePath();
  ctx.fill();

  // 路边石
  ctx.fillStyle = "#D9C7A2";
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

  // 中线与车道虚线（随道路向前滚）
  drawDashLine(ctx, 0, camX, "#F5F0D8", 6, time);
  // 左右车道中心淡色带
  ctx.globalAlpha = 0.2;
  fillLaneBand(ctx, -LANE_X, camX, "#5B9BFF");
  fillLaneBand(ctx, LANE_X, camX, "#E8A23A");
  ctx.globalAlpha = 1;
}

function fillLaneBand(ctx: CanvasRenderingContext2D, x: number, camX: number, color: string): void {
  const farL = pr(x - 1.6, 0.02, SPAWN_Z + 8, camX);
  const farR = pr(x + 1.6, 0.02, SPAWN_Z + 8, camX);
  const nearL = pr(x - 1.6, 0.02, 8.6, camX);
  const nearR = pr(x + 1.6, 0.02, 8.6, camX);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(farL.sx, farL.sy);
  ctx.lineTo(farR.sx, farR.sy);
  ctx.lineTo(nearR.sx, nearR.sy);
  ctx.lineTo(nearL.sx, nearL.sy);
  ctx.closePath();
  ctx.fill();
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
  const off = ((time * BASE_SPEED) % period);
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

function drawTree(ctx: CanvasRenderingContext2D, x: number, z: number, camX: number, s: number): void {
  const p = pr(x, 0, z, camX);
  const k = p.scale * s;
  if (k < 0.08) return;
  ctx.fillStyle = "rgba(40,60,40,0.22)";
  drawEllipse(ctx, p.sx, p.sy, 16 * k, 6 * k);
  ctx.fill();
  ctx.fillStyle = "#8A5A32";
  ctx.fillRect(p.sx - 5 * k, p.sy - 38 * k, 10 * k, 38 * k);
  ctx.fillStyle = "#4CAF6A";
  ctx.beginPath();
  ctx.arc(p.sx, p.sy - 52 * k, 22 * k, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#67C581";
  ctx.beginPath();
  ctx.arc(p.sx - 12 * k, p.sy - 44 * k, 14 * k, 0, Math.PI * 2);
  ctx.arc(p.sx + 13 * k, p.sy - 46 * k, 15 * k, 0, Math.PI * 2);
  ctx.fill();
}

function drawLamp(ctx: CanvasRenderingContext2D, x: number, z: number, camX: number): void {
  const p = pr(x, 0, z, camX);
  const k = p.scale;
  if (k < 0.08) return;
  ctx.fillStyle = "#6B7280";
  ctx.fillRect(p.sx - 2.2 * k, p.sy - 70 * k, 4.4 * k, 70 * k);
  ctx.fillStyle = "#F8E7A0";
  ctx.beginPath();
  ctx.arc(p.sx, p.sy - 74 * k, 7 * k, 0, Math.PI * 2);
  ctx.fill();
}

export function drawGate(ctx: CanvasRenderingContext2D, g: Gate, camX: number): void {
  const p = pr(g.x, 0, g.z, camX);
  const k = p.scale;
  const w = 148 * k;
  const h = 168 * k;
  const x = p.sx - w / 2;
  const y = p.sy - h;

  let panel = "rgba(56,140,255,0.48)";
  let frame = "#2B6DE0";
  let text = "#FFFFFF";
  if (g.kind === "red") {
    panel = "rgba(220,70,70,0.5)";
    frame = "#C43B3B";
  } else if (g.kind === "weapon") {
    panel = "rgba(232,168,40,0.52)";
    frame = "#D48912";
  } else if (g.kind === "mul") {
    panel = "rgba(70,110,255,0.55)";
    frame = "#3556E0";
  }

  // 立柱
  ctx.fillStyle = frame;
  roundRect(ctx, x - 8 * k, y, 14 * k, h + 4 * k, 4 * k);
  ctx.fill();
  roundRect(ctx, x + w - 6 * k, y, 14 * k, h + 4 * k, 4 * k);
  ctx.fill();
  // 顶梁
  roundRect(ctx, x - 10 * k, y - 12 * k, w + 20 * k, 16 * k, 5 * k);
  ctx.fill();

  ctx.fillStyle = panel;
  roundRect(ctx, x + 8 * k, y + 10 * k, w - 16 * k, h - 22 * k, 8 * k);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = Math.max(1, 2 * k);
  ctx.stroke();

  ctx.fillStyle = text;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const label = g.label;
  const fontSize = label.length > 2 ? 28 * k : 36 * k;
  ctx.font = `bold ${Math.max(10, fontSize)}px "PingFang SC","Microsoft YaHei",sans-serif`;
  ctx.fillText(label, p.sx, y + h * 0.48);

  if (g.kind === "weapon") {
    drawSmgIcon(ctx, p.sx, y + h * 0.72, k * 0.85, "#FFF8E7");
  }
}

export function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, camX: number): void {
  const p = pr(e.x, 0, e.z, camX);
  const def = ENEMY[e.type];
  const k = p.scale * def.scale;
  const walk = Math.sin(e.walk) * 3 * k;
  const lean = e.type === "sprinter" && e.dashing > 0 ? 8 * k : e.type === "sprinter" ? 3 * k : 0;

  ctx.save();
  ctx.translate(p.sx + lean, p.sy);

  ctx.fillStyle = "rgba(30,40,30,0.25)";
  drawEllipse(ctx, 0, 0, 22 * k, 8 * k);
  ctx.fill();

  const body = e.type === "sprinter" ? "#E8A23A" : "#7B8EE8";
  const bodyDark = e.type === "sprinter" ? "#D48912" : "#5C6BC8";
  const flash = e.hitFlash > 0;

  // 腿
  ctx.fillStyle = bodyDark;
  ctx.fillRect(-10 * k + walk, -14 * k, 8 * k, 14 * k);
  ctx.fillRect(3 * k - walk, -14 * k, 8 * k, 14 * k);

  // 身体
  ctx.fillStyle = flash ? "#FFFFFF" : body;
  if (e.type === "sprinter") {
    drawEllipse(ctx, 0, -28 * k, 16 * k, 22 * k);
    ctx.fill();
  } else {
    drawEllipse(ctx, 0, -30 * k, 22 * k, 24 * k);
    ctx.fill();
  }

  // 头
  ctx.fillStyle = flash ? "#FFFFFF" : body;
  const headY = e.type === "sprinter" ? -52 * k : -56 * k;
  const headR = e.type === "sprinter" ? 13 * k : 16 * k;
  ctx.beginPath();
  ctx.arc(0, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // 眼睛（圆点，卡通困倦，不画裂口或獠牙）
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(-5 * k, headY - 1 * k, 4.2 * k, 0, Math.PI * 2);
  ctx.arc(5 * k, headY - 1 * k, 4.2 * k, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2B2F4A";
  ctx.beginPath();
  ctx.arc(-5 * k, headY - 0.5 * k, 1.8 * k, 0, Math.PI * 2);
  ctx.arc(5 * k, headY - 0.5 * k, 1.8 * k, 0, Math.PI * 2);
  ctx.fill();

  // 冲刺体加速时的风线
  if (e.type === "sprinter" && e.dashing > 0) {
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = Math.max(1, 2 * k);
    ctx.beginPath();
    ctx.moveTo(-22 * k, -40 * k);
    ctx.lineTo(-34 * k, -36 * k);
    ctx.moveTo(-20 * k, -24 * k);
    ctx.lineTo(-32 * k, -20 * k);
    ctx.stroke();
  }

  ctx.restore();
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
  const bounce = Math.sin(bob) * 2.2 * k;
  ctx.save();
  ctx.translate(sx, sy + bounce);

  ctx.fillStyle = "rgba(30,40,30,0.25)";
  drawEllipse(ctx, 0, 0, 16 * k, 6 * k);
  ctx.fill();

  const skin = flash > 0 ? "#FFFFFF" : "#F3C7A0";
  const jacket = flash > 0 ? "#FFFFFF" : "#3D8CDB";
  const pants = flash > 0 ? "#E8EEF8" : "#2E5A8F";
  const helm = flash > 0 ? "#FFFFFF" : "#F0A020";

  const legSwing = Math.sin(bob) * 3 * k;
  ctx.fillStyle = pants;
  ctx.fillRect(-9 * k + legSwing, -16 * k, 7 * k, 16 * k);
  ctx.fillRect(2 * k - legSwing, -16 * k, 7 * k, 16 * k);

  ctx.fillStyle = jacket;
  roundRect(ctx, -12 * k, -40 * k, 24 * k, 26 * k, 6 * k);
  ctx.fill();

  // 手臂 + 枪
  ctx.fillStyle = jacket;
  ctx.fillRect(8 * k, -36 * k, 7 * k, 14 * k);
  drawGun(ctx, 14 * k, -32 * k, k, weapon, flash > 0 ? "#FFFFFF" : "#3A3F4A");

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -50 * k, 11 * k, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = helm;
  ctx.beginPath();
  ctx.arc(0, -54 * k, 12 * k, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-12 * k, -54 * k, 24 * k, 5 * k);

  ctx.fillStyle = "#2B2F4A";
  ctx.beginPath();
  ctx.arc(-3.5 * k, -50 * k, 1.5 * k, 0, Math.PI * 2);
  ctx.arc(3.5 * k, -50 * k, 1.5 * k, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawGun(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, weapon: "pistol" | "smg", color: string): void {
  ctx.fillStyle = color;
  if (weapon === "smg") {
    ctx.fillRect(x, y - 3 * k, 22 * k, 6 * k);
    ctx.fillRect(x + 4 * k, y + 3 * k, 5 * k, 8 * k);
    ctx.fillRect(x + 14 * k, y - 6 * k, 4 * k, 4 * k);
  } else {
    ctx.fillRect(x, y - 2 * k, 14 * k, 5 * k);
    ctx.fillRect(x + 2 * k, y + 3 * k, 4 * k, 7 * k);
  }
}

function drawSmgIcon(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x - 16 * k, y - 4 * k, 32 * k, 8 * k);
  ctx.fillRect(x - 8 * k, y + 4 * k, 7 * k, 10 * k);
  ctx.fillRect(x + 6 * k, y - 9 * k, 5 * k, 6 * k);
}

export function drawSquad(ctx: CanvasRenderingContext2D, squad: Squad, camX: number): void {
  const members = squad.pool.active.slice().sort((a, b) => {
    const sa = squad.slotOf(a.slot);
    const sb = squad.slotOf(b.slot);
    return sa.z - sb.z;
  });
  const weapon = squad.weapon === "smg" ? "smg" : "pistol";
  for (const s of members) {
    const slot = squad.slotOf(s.slot);
    const p = pr(squad.x + slot.x, 0, squad.z + slot.z, camX);
    drawSoldier(ctx, p.sx, p.sy, p.scale, s.bob, s.flash, weapon);
  }
}

export function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet, camX: number): void {
  const p = pr(b.x, b.y, b.z, camX);
  const k = p.scale;
  ctx.fillStyle = "#FFF8C8";
  ctx.beginPath();
  ctx.arc(p.sx, p.sy, Math.max(2, 5 * k), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,240,160,0.45)";
  ctx.beginPath();
  ctx.ellipse(p.sx, p.sy + 8 * k, 3 * k, 9 * k, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawParticle(ctx: CanvasRenderingContext2D, p: Particle, camX: number): void {
  const s = pr(p.x, Math.max(0, p.y), p.z, camX);
  const t = p.life / p.maxLife;
  ctx.globalAlpha = Math.max(0, t);
  ctx.fillStyle = p.color;
  const sz = p.size * s.scale * (p.kind === "puff" ? 1.4 - t * 0.4 : 1);
  if (p.kind === "puff") {
    ctx.beginPath();
    ctx.arc(s.sx, s.sy, Math.max(1, sz), 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(s.sx - sz / 2, s.sy - sz / 2, sz, sz);
  }
  ctx.globalAlpha = 1;
}

export interface HudInfo {
  count: number;
  weapon: "pistol" | "smg";
  weaponTime: number;
  remain: number;
  fireBonus: number;
  muted: boolean;
  hint: boolean;
  clearing: boolean;
}

export function drawHud(ctx: CanvasRenderingContext2D, hud: HudInfo): void {
  // 顶部条
  ctx.fillStyle = "rgba(20,24,32,0.45)";
  roundRect(ctx, 24, 24, CANVAS_W - 48, 84, 18);
  ctx.fill();

  // 人数
  ctx.fillStyle = "rgba(40,90,180,0.9)";
  roundRect(ctx, 40, 40, 150, 52, 14);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = 'bold 28px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("人数 " + hud.count, 56, 67);

  // 武器
  ctx.fillStyle = hud.weapon === "smg" ? "rgba(212,137,18,0.95)" : "rgba(70,80,96,0.95)";
  roundRect(ctx, 210, 40, 200, 52, 14);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = 'bold 22px "PingFang SC","Microsoft YaHei",sans-serif';
  const wname = WEAPONS[hud.weapon].name;
  const extra = hud.weapon === "smg" ? " " + Math.ceil(Math.max(0, hud.weaponTime)) + "s" : "";
  ctx.fillText(wname + extra, 226, 67);

  // 倒计时
  ctx.fillStyle = "rgba(20,24,32,0.8)";
  roundRect(ctx, CANVAS_W - 210, 40, 170, 52, 14);
  ctx.fill();
  ctx.fillStyle = hud.remain <= 10 && !hud.clearing ? "#FFE08A" : "#FFFFFF";
  ctx.font = 'bold 28px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(hud.clearing ? "清场" : formatTime(hud.remain), CANVAS_W - 125, 67);

  if (hud.fireBonus > 0) {
    ctx.fillStyle = "rgba(56,140,255,0.92)";
    roundRect(ctx, 40, 118, 200, 36, 12);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = 'bold 18px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("射速提升 " + hud.fireBonus.toFixed(1) + "s", 54, 137);
  }

  drawMute(ctx, hud.muted);

  if (hud.hint) {
    ctx.fillStyle = "rgba(16,20,28,0.72)";
    roundRect(ctx, 70, CANVAS_H - 210, CANVAS_W - 140, 72, 18);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = 'bold 22px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("左右滑动 · 自动开火 · 穿蓝门加人", CANVAS_W / 2, CANVAS_H - 172);
  }
}

export function hitMute(x: number, y: number): boolean {
  const dx = x - (CANVAS_W - 56);
  const dy = y - 150;
  return dx * dx + dy * dy <= 26 * 26;
}

export function drawMute(ctx: CanvasRenderingContext2D, muted: boolean): void {
  ctx.fillStyle = "rgba(20,24,32,0.55)";
  ctx.beginPath();
  ctx.arc(CANVAS_W - 56, 150, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = '18px "PingFang SC","Microsoft YaHei",sans-serif';
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
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.font = 'bold 64px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText("路口火力", CANVAS_W / 2, 360);
  ctx.font = '24px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("自动开火 · 穿门集结", CANVAS_W / 2, 420);

  drawButton(ctx, CANVAS_W / 2 - 140, 560, 280, 80, "#3D8CDB", "开始游戏");

  ctx.fillStyle = "rgba(255,255,255,0.8)";
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
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("隐私政策  |  适龄提示", CANVAS_W / 2, CANVAS_H - 80);
}

export function titleHit(x: number, y: number): "start" | "legal" | null {
  if (x >= CANVAS_W / 2 - 140 && x <= CANVAS_W / 2 + 140 && y >= 560 && y <= 640) return "start";
  if (y >= CANVAS_H - 110 && y <= CANVAS_H - 50) return "legal";
  return null;
}

export function drawLegal(ctx: CanvasRenderingContext2D): void {
  dim(ctx);
  ctx.fillStyle = "rgba(24,28,36,0.96)";
  roundRect(ctx, 70, 280, CANVAS_W - 140, 640, 22);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.font = 'bold 30px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText("隐私政策与适龄提示", CANVAS_W / 2, 350);
  ctx.font = '20px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillStyle = "rgba(255,255,255,0.85)";
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
  drawButton(ctx, CANVAS_W / 2 - 110, 800, 220, 64, "#3D8CDB", "返回");
}

export function legalHit(x: number, y: number): boolean {
  return x >= CANVAS_W / 2 - 110 && x <= CANVAS_W / 2 + 110 && y >= 800 && y <= 864;
}

export function drawResult(
  ctx: CanvasRenderingContext2D,
  win: boolean,
  kills: number,
  time: number,
  peak: number,
  best: { kills: number; peakCount: number },
): void {
  dim(ctx);
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.font = 'bold 52px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText(win ? "成功通关！" : "队伍已解散", CANVAS_W / 2, 340);
  ctx.font = '24px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.fillText(win ? "坚持到了终点并清空了收束波" : "人数归零，再整队出发吧", CANVAS_W / 2, 400);

  const rows = [
    ["击杀", String(kills)],
    ["坚持时间", formatTime(time)],
    ["本局最高人数", String(peak)],
    ["历史最高击杀", String(best.kills)],
    ["历史最高人数", String(best.peakCount)],
  ];
  let y = 470;
  ctx.font = '22px "PingFang SC","Microsoft YaHei",sans-serif';
  for (const [k, v] of rows) {
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.textAlign = "left";
    ctx.fillText(k, 200, y);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "right";
    ctx.fillText(v, CANVAS_W - 200, y);
    y += 44;
  }

  drawButton(ctx, CANVAS_W / 2 - 140, 740, 280, 80, "#3D8CDB", "再来一局");
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
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = 'bold 32px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + h / 2 + 2);
}

function dim(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(10,14,22,0.55)";
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

export { RUN_DURATION };
