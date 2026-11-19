export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function expDamp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export function laneWorldX(lane: "left" | "right", laneX: number): number {
  return lane === "left" ? -laneX : laneX;
}

export interface Projected {
  sx: number;
  sy: number;
  scale: number;
  groundY: number;
}

export function project(
  x: number,
  y: number,
  z: number,
  camX: number,
  opts: { w: number; horizonY: number; nearY: number; teamZ: number; laneX: number; laneScreen: number },
): Projected {
  const t = opts.teamZ / Math.max(z, 0.6);
  const sx = opts.w * 0.5 + (x - camX) * (opts.laneScreen / opts.laneX) * t;
  const groundY = opts.horizonY + (opts.nearY - opts.horizonY) * t;
  const sy = groundY - y * 36 * t;
  return { sx, sy, scale: t, groundY };
}

export function formatTime(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ":" + (r < 10 ? "0" : "") + r;
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function drawEllipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}
