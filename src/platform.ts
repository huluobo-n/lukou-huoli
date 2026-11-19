import { ASPECT, CANVAS_H, CANVAS_W } from "./config";

export interface PointerSample {
  x: number;
  y: number;
  id: number;
}

export interface Platform {
  kind: "web" | "wx";
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dpr: number;
  cssWidth: number;
  cssHeight: number;
  now(): number;
  raf(cb: (t: number) => void): number;
  getStorage(key: string): string | null;
  setStorage(key: string, value: string): void;
  onResize(cb: () => void): void;
  onPointerDown(cb: (p: PointerSample) => void): void;
  onPointerMove(cb: (p: PointerSample) => void): void;
  onPointerUp(cb: (p: PointerSample) => void): void;
  onKeyDown(cb: (key: string) => void): void;
  onKeyUp(cb: (key: string) => void): void;
  layout(): void;
  /** 画布 CSS 像素 → 逻辑 720×1280 */
  toLogic(cssX: number, cssY: number): { x: number; y: number };
  tryAudioContext(): AudioContext | null;
}

function isWx(): boolean {
  return typeof wx !== "undefined" && typeof wx.createCanvas === "function";
}

function applyBackingStore(canvas: HTMLCanvasElement, cssW: number, cssH: number, dpr: number): void {
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
}

export function createPlatform(): Platform {
  return isWx() ? createWxPlatform() : createWebPlatform();
}

function createWebPlatform(): Platform {
  const canvas = document.getElementById("game") as HTMLCanvasElement | null
    ?? document.querySelector("canvas")
    ?? document.createElement("canvas");
  if (!canvas.parentElement) {
    document.body.appendChild(canvas);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建画布上下文");

  const self: Platform = {
    kind: "web",
    canvas,
    ctx,
    dpr: 1,
    cssWidth: CANVAS_W,
    cssHeight: CANVAS_H,
    now: () => (typeof performance !== "undefined" ? performance.now() : Date.now()),
    raf: (cb) => requestAnimationFrame(cb),
    getStorage(key) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setStorage(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* ignore quota */
      }
    },
    onResize(cb) {
      window.addEventListener("resize", cb);
      window.addEventListener("orientationchange", cb);
    },
    onPointerDown(cb) {
      const handle = (ev: PointerEvent) => {
        ev.preventDefault();
        canvas.setPointerCapture(ev.pointerId);
        const r = canvas.getBoundingClientRect();
        cb({ x: ev.clientX - r.left, y: ev.clientY - r.top, id: ev.pointerId });
      };
      canvas.addEventListener("pointerdown", handle);
    },
    onPointerMove(cb) {
      canvas.addEventListener("pointermove", (ev) => {
        if (ev.buttons === 0 && ev.pointerType !== "touch") {
          /* 允许未按下的移动被上层忽略；仍上报，由 input 判断是否按住 */
        }
        const r = canvas.getBoundingClientRect();
        cb({ x: ev.clientX - r.left, y: ev.clientY - r.top, id: ev.pointerId });
      });
    },
    onPointerUp(cb) {
      const up = (ev: PointerEvent) => {
        const r = canvas.getBoundingClientRect();
        cb({ x: ev.clientX - r.left, y: ev.clientY - r.top, id: ev.pointerId });
      };
      canvas.addEventListener("pointerup", up);
      canvas.addEventListener("pointercancel", up);
    },
    onKeyDown(cb) {
      window.addEventListener("keydown", (e) => {
        if (e.repeat) {
          cb(e.key);
          return;
        }
        cb(e.key);
      });
    },
    onKeyUp(cb) {
      window.addEventListener("keyup", (e) => cb(e.key));
    },
    layout() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // 留一点边距，避免被浏览器工具栏裁切
      const padX = vw > 520 ? 24 : 8;
      const padY = vw > 520 ? 24 : 8;
      const availW = Math.max(80, vw - padX * 2);
      const availH = Math.max(80, vh - padY * 2);
      let cssW = availW;
      let cssH = cssW / ASPECT;
      if (cssH > availH) {
        cssH = availH;
        cssW = cssH * ASPECT;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      self.dpr = dpr;
      self.cssWidth = cssW;
      self.cssHeight = cssH;
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      applyBackingStore(canvas, cssW, cssH, dpr);
    },
    toLogic(cssX, cssY) {
      return {
        x: (cssX / self.cssWidth) * CANVAS_W,
        y: (cssY / self.cssHeight) * CANVAS_H,
      };
    },
    tryAudioContext() {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      return new Ctor();
    },
  };

  self.layout();
  return self;
}

function createWxPlatform(): Platform {
  const canvas = wx.createCanvas();
  const sys = wx.getSystemInfoSync();
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建画布上下文");

  const self: Platform = {
    kind: "wx",
    canvas,
    ctx,
    dpr: 1,
    cssWidth: sys.windowWidth,
    cssHeight: sys.windowHeight,
    now: () => Date.now(),
    raf: (cb) => requestAnimationFrame(cb),
    getStorage(key) {
      try {
        const v = wx.getStorageSync(key);
        return v == null || v === "" ? null : String(v);
      } catch {
        return null;
      }
    },
    setStorage(key, value) {
      try {
        wx.setStorageSync(key, value);
      } catch {
        /* ignore */
      }
    },
    onResize(cb) {
      if (typeof wx.onShow === "function") wx.onShow(cb);
    },
    onPointerDown(cb) {
      wx.onTouchStart((e) => {
        const t = e.changedTouches[0];
        if (t) cb({ x: t.clientX, y: t.clientY, id: t.identifier });
      });
    },
    onPointerMove(cb) {
      wx.onTouchMove((e) => {
        const t = e.changedTouches[0];
        if (t) cb({ x: t.clientX, y: t.clientY, id: t.identifier });
      });
    },
    onPointerUp(cb) {
      const up = (e: WxTouchEvent) => {
        const t = e.changedTouches[0];
        if (t) cb({ x: t.clientX, y: t.clientY, id: t.identifier });
      };
      wx.onTouchEnd(up);
      wx.onTouchCancel(up);
    },
    onKeyDown() {
      /* 小游戏无键盘 */
    },
    onKeyUp() {
      /* 小游戏无键盘 */
    },
    layout() {
      const info = wx.getSystemInfoSync();
      const vw = info.windowWidth;
      const vh = info.windowHeight;
      let cssW = vw;
      let cssH = cssW / ASPECT;
      let offsetY = 0;
      if (cssH > vh) {
        cssH = vh;
        cssW = cssH * ASPECT;
      }
      offsetY = (vh - cssH) / 2;
      const dpr = Math.min(info.pixelRatio || 1, 2);
      self.dpr = dpr;
      self.cssWidth = cssW;
      self.cssHeight = cssH;
      // 将逻辑布局信息挂到 canvas，绘制时做偏移
      (self as Platform & { offsetY: number; offsetX: number }).offsetY = offsetY;
      (self as Platform & { offsetY: number; offsetX: number }).offsetX = (vw - cssW) / 2;
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
    },
    toLogic(cssX, cssY) {
      const extra = self as Platform & { offsetY: number; offsetX: number };
      const ox = extra.offsetX || 0;
      const oy = extra.offsetY || 0;
      return {
        x: ((cssX - ox) / self.cssWidth) * CANVAS_W,
        y: ((cssY - oy) / self.cssHeight) * CANVAS_H,
      };
    },
    tryAudioContext() {
      if (typeof wx.createWebAudioContext === "function") {
        return wx.createWebAudioContext() as unknown as AudioContext;
      }
      return null;
    },
  };

  (self as Platform & { offsetY: number; offsetX: number }).offsetY = 0;
  (self as Platform & { offsetY: number; offsetX: number }).offsetX = 0;
  self.layout();
  return self;
}

export function beginFrame(platform: Platform): void {
  const { ctx, canvas, dpr, cssWidth, cssHeight } = platform;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const extra = platform as Platform & { offsetX?: number; offsetY?: number };
  const ox = (extra.offsetX || 0) * dpr;
  const oy = (extra.offsetY || 0) * dpr;
  ctx.setTransform(
    (cssWidth * dpr) / CANVAS_W,
    0,
    0,
    (cssHeight * dpr) / CANVAS_H,
    ox,
    oy,
  );
}
