/** 相对路径资源，浏览器（含 GitHub Pages 子路径）与微信小游戏共用。 */

export interface SpriteInfo {
  file: string;
  muzzle?: [number, number];
  hole?: [number, number];
}

export const SPRITES = {
  soldier_pistol_0: { file: "soldier_pistol_0.png", muzzle: [0.9704, 0.4588] as [number, number] },
  soldier_pistol_1: { file: "soldier_pistol_1.png", muzzle: [0.9679, 0.4073] as [number, number] },
  soldier_smg_0: { file: "soldier_smg_0.png", muzzle: [0.9669, 0.4379] as [number, number] },
  soldier_smg_1: { file: "soldier_smg_1.png", muzzle: [0.9629, 0.4026] as [number, number] },
  walker_0: { file: "walker_0.png" },
  walker_1: { file: "walker_1.png" },
  sprinter_0: { file: "sprinter_0.png" },
  gate_blue: { file: "gate_blue.png", hole: [0.4984, 0.5363] as [number, number] },
  gate_coral: { file: "gate_coral.png", hole: [0.5048, 0.558] as [number, number] },
  gate_gold: { file: "gate_gold.png", hole: [0.4963, 0.5368] as [number, number] },
  hud_portrait: { file: "hud_portrait.png" },
  icon_pistol: { file: "icon_pistol.png" },
  icon_smg: { file: "icon_smg.png" },
  tree_0: { file: "tree_0.png" },
  tree_1: { file: "tree_1.png" },
  house_0: { file: "house_0.png" },
  house_1: { file: "house_1.png" },
  house_2: { file: "house_2.png" },
  house_3: { file: "house_3.png" },
  sky: { file: "sky_horizon.jpg" },
} as const;

export type SpriteId = keyof typeof SPRITES;

const images: Partial<Record<SpriteId, HTMLImageElement>> = {};
let preloadOnce: Promise<void> | null = null;

function assetSrc(file: string): string {
  return "assets/" + file;
}

function makeImage(): HTMLImageElement | null {
  if (typeof wx !== "undefined" && typeof wx.createImage === "function") {
    return wx.createImage();
  }
  if (typeof Image !== "undefined") {
    return new Image();
  }
  return null;
}

function loadOne(id: SpriteId): Promise<void> {
  const spec = SPRITES[id];
  return new Promise((resolve) => {
    const img = makeImage();
    if (!img) {
      resolve();
      return;
    }
    const done = () => {
      images[id] = img;
      resolve();
    };
    img.onload = done;
    img.onerror = () => resolve();
    img.src = assetSrc(spec.file);
  });
}

export function preloadAssets(): Promise<void> {
  if (preloadOnce) return preloadOnce;
  preloadOnce = Promise.all((Object.keys(SPRITES) as SpriteId[]).map(loadOne)).then(() => undefined);
  return preloadOnce;
}

export function getSprite(id: SpriteId): HTMLImageElement | null {
  const img = images[id];
  if (!img) return null;
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return null;
  return img;
}

export function spriteReady(id: SpriteId): boolean {
  return getSprite(id) !== null;
}

/** 以底部中心为锚点绘制，高度为 h，宽度按素材比例。返回实际宽高。 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  id: SpriteId,
  x: number,
  y: number,
  h: number,
  opts?: { flip?: boolean; alpha?: number; flash?: number },
): { w: number; h: number } | null {
  const img = getSprite(id);
  if (!img || h <= 0) return null;
  const w = h * ((img.naturalWidth || img.width) / (img.naturalHeight || img.height));
  const alpha = opts?.alpha ?? 1;
  ctx.save();
  ctx.translate(x, y);
  if (opts?.flip) ctx.scale(-1, 1);
  ctx.globalAlpha *= alpha;
  ctx.drawImage(img, -w / 2, -h, w, h);
  if (opts?.flash && opts.flash > 0) {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha *= Math.min(1, opts.flash) * 0.75;
    ctx.drawImage(img, -w / 2, -h, w, h);
  }
  ctx.restore();
  return { w, h };
}

export function muzzleOf(id: SpriteId): [number, number] {
  const m = (SPRITES[id] as SpriteInfo).muzzle;
  return m ?? [0.96, 0.44];
}

export function holeOf(id: SpriteId): [number, number] {
  const h = (SPRITES[id] as SpriteInfo).hole;
  return h ?? [0.5, 0.54];
}
