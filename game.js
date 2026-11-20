"use strict";
(() => {
  // src/config.ts
  var CANVAS_W = 720;
  var CANVAS_H = 1280;
  var ASPECT = CANVAS_W / CANVAS_H;
  var TEAM_Z = 14;
  var SPAWN_Z = 58;
  var DESPAWN_Z = 12;
  var HORIZON_Y = 352;
  var NEAR_Y = 958;
  var LANE_X = 3.25;
  var LANE_HALF = 2.55;
  var LANE_SCREEN = 152;
  var ROAD_HALF = 6.4;
  var BASE_SPEED = 14;
  var BULLET_SPEED = 52;
  var BULLET_RANGE_Z = 50;
  var MAX_BULLETS = 80;
  var MAX_ENEMIES = 25;
  var MAX_SQUAD = 20;
  var WEAPONS = {
    pistol: {
      id: "pistol",
      name: "\u624B\u67AA",
      damage: 1,
      rate: 4,
      duration: Infinity
    },
    smg: {
      id: "smg",
      name: "\u51B2\u950B\u67AA",
      damage: 0.7,
      rate: 12,
      duration: 15
    }
  };
  var ENEMY = {
    walker: {
      id: "walker",
      name: "\u6E38\u8D70\u4F53",
      speed: 1,
      hp: 3,
      radius: 0.72,
      scale: 1,
      contactLoss: 1
    },
    sprinter: {
      id: "sprinter",
      name: "\u51B2\u523A\u4F53",
      speed: 1.7,
      hp: 2,
      radius: 0.52,
      scale: 0.78,
      contactLoss: 1,
      dashEvery: 1.8,
      dashDuration: 0.45,
      dashMul: 2.15
    }
  };
  var HIT_IFRAMES = 0.85;
  var OVERFLOW_BONUS_DURATION = 3;
  var OVERFLOW_BONUS_MUL = 1.6;
  var STORAGE_KEY = "lukou-huoli-best";
  var GATE_EVENTS = [
    // —— 0–10 秒教学 ——
    { time: 6, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
    { time: 7.25, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "\u51B2\u950B\u67AA" },
    // —— 10–40 秒：左道 +N / ×2 / 武器门 ——
    { time: 11.5, kind: "gate", lane: "left", gate: "add", value: 2, label: "+2" },
    { time: 16, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "\u51B2\u950B\u67AA" },
    { time: 22, kind: "gate", lane: "left", gate: "mul", value: 2, label: "\xD72" },
    { time: 27, kind: "gate", lane: "left", gate: "add", value: 5, label: "+5" },
    { time: 32.8, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
    { time: 36.5, kind: "gate", lane: "left", gate: "add", value: 8, label: "+8" },
    // —— 40–70 秒：约 40 秒后出现成对红门 -3 / 蓝门 +3 ——
    { time: 40.5, kind: "gate", lane: "right", gate: "red", value: 3, label: "-3" },
    { time: 40.5, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
    { time: 48.5, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "\u51B2\u950B\u67AA" },
    { time: 51, kind: "gate", lane: "left", gate: "add", value: 5, label: "+5" },
    { time: 58, kind: "gate", lane: "left", gate: "red", value: 3, label: "-3" },
    { time: 62.5, kind: "gate", lane: "left", gate: "add", value: 8, label: "+8" },
    { time: 67, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "\u51B2\u950B\u67AA" }
  ];
  var RIGHT_LANE_GAPS = [[39.85, 41.15]];
  function inRightLaneGap(time) {
    return RIGHT_LANE_GAPS.some(([a, b]) => time >= a && time <= b);
  }
  function addEnemy(events, time, enemy) {
    const t = Math.round(time * 100) / 100;
    if (inRightLaneGap(t)) return;
    events.push({ time: t, kind: "enemy", lane: "right", enemy });
  }
  function buildHorde() {
    const events = [];
    for (let t = 2; t <= 6; t += 1) addEnemy(events, t, "walker");
    for (let t = 7.2; t < 20; t += 0.55) addEnemy(events, t, "walker");
    for (let t = 20; t < 40; t += 0.4) addEnemy(events, t, "walker");
    for (let t = 40; t < 70; t += 0.45) {
      addEnemy(events, t, "walker");
      addEnemy(events, t + 0.12, "sprinter");
    }
    for (let t = 70; t <= 87; t += 0.36) {
      addEnemy(events, t, "walker");
      addEnemy(events, t + 0.1, "sprinter");
    }
    return events;
  }
  var TIMELINE = [...GATE_EVENTS, ...buildHorde()].sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    if (a.kind === b.kind) return 0;
    return a.kind === "gate" ? -1 : 1;
  });
  var enemyTimes = TIMELINE.filter((e) => e.kind === "enemy").map((e) => e.time);
  var SCRIPT_ENEMY_END = Math.max(...enemyTimes);
  var ENDLESS_GATE_START = 75;
  var ENDLESS_GATE_PERIOD = 8;
  var ENDLESS_GATE_CYCLE = [
    { time: 0, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
    { time: 0, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "\u51B2\u950B\u67AA" },
    { time: 0, kind: "gate", lane: "left", gate: "add", value: 5, label: "+5" },
    { time: 0, kind: "gate", lane: "left", gate: "add", value: 8, label: "+8" },
    { time: 0, kind: "gate", lane: "left", gate: "mul", value: 2, label: "\xD72" },
    { time: 0, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "\u51B2\u950B\u67AA" }
  ];
  function endlessHordeInterval(t) {
    return Math.max(0.22, 0.36 - Math.max(0, t - 70) * 12e-4);
  }

  // src/platform.ts
  function isWx() {
    return typeof wx !== "undefined" && typeof wx.createCanvas === "function";
  }
  function applyBackingStore(canvas, cssW, cssH, dpr) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  function createPlatform() {
    return isWx() ? createWxPlatform() : createWebPlatform();
  }
  function createWebPlatform() {
    var _a, _b;
    const canvas = (_b = (_a = document.getElementById("game")) != null ? _a : document.querySelector("canvas")) != null ? _b : document.createElement("canvas");
    if (!canvas.parentElement) {
      document.body.appendChild(canvas);
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("\u65E0\u6CD5\u521B\u5EFA\u753B\u5E03\u4E0A\u4E0B\u6587");
    const self = {
      kind: "web",
      canvas,
      ctx,
      dpr: 1,
      cssWidth: CANVAS_W,
      cssHeight: CANVAS_H,
      now: () => typeof performance !== "undefined" ? performance.now() : Date.now(),
      raf: (cb) => requestAnimationFrame(cb),
      getStorage(key) {
        try {
          return window.localStorage.getItem(key);
        } catch (e) {
          return null;
        }
      },
      setStorage(key, value) {
        try {
          window.localStorage.setItem(key, value);
        } catch (e) {
        }
      },
      onResize(cb) {
        window.addEventListener("resize", cb);
        window.addEventListener("orientationchange", cb);
      },
      onPointerDown(cb) {
        const handle = (ev) => {
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
          }
          const r = canvas.getBoundingClientRect();
          cb({ x: ev.clientX - r.left, y: ev.clientY - r.top, id: ev.pointerId });
        });
      },
      onPointerUp(cb) {
        const up = (ev) => {
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
          x: cssX / self.cssWidth * CANVAS_W,
          y: cssY / self.cssHeight * CANVAS_H
        };
      },
      tryAudioContext() {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return null;
        return new Ctor();
      }
    };
    self.layout();
    return self;
  }
  function createWxPlatform() {
    const canvas = wx.createCanvas();
    const sys = wx.getSystemInfoSync();
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("\u65E0\u6CD5\u521B\u5EFA\u753B\u5E03\u4E0A\u4E0B\u6587");
    const self = {
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
        } catch (e) {
          return null;
        }
      },
      setStorage(key, value) {
        try {
          wx.setStorageSync(key, value);
        } catch (e) {
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
        const up = (e) => {
          const t = e.changedTouches[0];
          if (t) cb({ x: t.clientX, y: t.clientY, id: t.identifier });
        };
        wx.onTouchEnd(up);
        wx.onTouchCancel(up);
      },
      onKeyDown() {
      },
      onKeyUp() {
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
        self.offsetY = offsetY;
        self.offsetX = (vw - cssW) / 2;
        canvas.width = Math.round(vw * dpr);
        canvas.height = Math.round(vh * dpr);
      },
      toLogic(cssX, cssY) {
        const extra = self;
        const ox = extra.offsetX || 0;
        const oy = extra.offsetY || 0;
        return {
          x: (cssX - ox) / self.cssWidth * CANVAS_W,
          y: (cssY - oy) / self.cssHeight * CANVAS_H
        };
      },
      tryAudioContext() {
        if (typeof wx.createWebAudioContext === "function") {
          return wx.createWebAudioContext();
        }
        return null;
      }
    };
    self.offsetY = 0;
    self.offsetX = 0;
    self.layout();
    return self;
  }
  function beginFrame(platform) {
    const { ctx, canvas, dpr, cssWidth, cssHeight } = platform;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const extra = platform;
    const ox = (extra.offsetX || 0) * dpr;
    const oy = (extra.offsetY || 0) * dpr;
    ctx.setTransform(
      cssWidth * dpr / CANVAS_W,
      0,
      0,
      cssHeight * dpr / CANVAS_H,
      ox,
      oy
    );
  }

  // src/assets.ts
  var SPRITES = {
    soldier_pistol_0: { file: "soldier_pistol_0.png", muzzle: [0.9704, 0.4588] },
    soldier_pistol_1: { file: "soldier_pistol_1.png", muzzle: [0.9679, 0.4073] },
    soldier_smg_0: { file: "soldier_smg_0.png", muzzle: [0.9669, 0.4379] },
    soldier_smg_1: { file: "soldier_smg_1.png", muzzle: [0.9629, 0.4026] },
    walker_0: { file: "walker_0.png" },
    walker_1: { file: "walker_1.png" },
    sprinter_0: { file: "sprinter_0.png" },
    gate_blue: { file: "gate_blue.png", hole: [0.4984, 0.5363] },
    gate_coral: { file: "gate_coral.png", hole: [0.5048, 0.558] },
    gate_gold: { file: "gate_gold.png", hole: [0.4963, 0.5368] },
    hud_portrait: { file: "hud_portrait.png" },
    icon_pistol: { file: "icon_pistol.png" },
    icon_smg: { file: "icon_smg.png" },
    tree_0: { file: "tree_0.png" },
    tree_1: { file: "tree_1.png" },
    house_0: { file: "house_0.png" },
    house_1: { file: "house_1.png" },
    house_2: { file: "house_2.png" },
    house_3: { file: "house_3.png" },
    sky: { file: "sky_horizon.jpg" }
  };
  var images = {};
  var preloadOnce = null;
  function assetSrc(file) {
    return "assets/" + file;
  }
  function makeImage() {
    if (typeof wx !== "undefined" && typeof wx.createImage === "function") {
      return wx.createImage();
    }
    if (typeof Image !== "undefined") {
      return new Image();
    }
    return null;
  }
  function loadOne(id) {
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
  function preloadAssets() {
    if (preloadOnce) return preloadOnce;
    preloadOnce = Promise.all(Object.keys(SPRITES).map(loadOne)).then(() => void 0);
    return preloadOnce;
  }
  function getSprite(id) {
    const img = images[id];
    if (!img) return null;
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return null;
    return img;
  }
  function drawSprite(ctx, id, x, y, h, opts) {
    var _a;
    const img = getSprite(id);
    if (!img || h <= 0) return null;
    const w = h * ((img.naturalWidth || img.width) / (img.naturalHeight || img.height));
    const alpha = (_a = opts == null ? void 0 : opts.alpha) != null ? _a : 1;
    ctx.save();
    ctx.translate(x, y);
    if (opts == null ? void 0 : opts.flip) ctx.scale(-1, 1);
    ctx.globalAlpha *= alpha;
    ctx.drawImage(img, -w / 2, -h, w, h);
    if ((opts == null ? void 0 : opts.flash) && opts.flash > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha *= Math.min(1, opts.flash) * 0.75;
      ctx.drawImage(img, -w / 2, -h, w, h);
    }
    ctx.restore();
    return { w, h };
  }
  function muzzleOf(id) {
    const m = SPRITES[id].muzzle;
    return m != null ? m : [0.96, 0.44];
  }
  function holeOf(id) {
    const h = SPRITES[id].hole;
    return h != null ? h : [0.5, 0.54];
  }

  // src/ads.ts
  var ads = {
    enabled: false,
    showRewarded() {
      return Promise.resolve(false);
    },
    showInterstitial() {
      return Promise.resolve();
    }
  };

  // src/storage.ts
  var EMPTY_BEST = { kills: 0, peakCount: 0, time: 0 };
  function loadBest(platform) {
    const raw = platform.getStorage(STORAGE_KEY);
    if (!raw) return { ...EMPTY_BEST };
    try {
      const parsed = JSON.parse(raw);
      return {
        kills: Number(parsed.kills) || 0,
        peakCount: Number(parsed.peakCount) || 0,
        time: Number(parsed.time) || 0
      };
    } catch (e) {
      return { ...EMPTY_BEST };
    }
  }
  function saveBest(platform, current, prev) {
    const next = {
      kills: Math.max(prev.kills, current.kills),
      peakCount: Math.max(prev.peakCount, current.peakCount),
      time: Math.max(prev.time, current.time)
    };
    platform.setStorage(STORAGE_KEY, JSON.stringify(next));
    return next;
  }
  function loadMuted(platform) {
    return platform.getStorage(STORAGE_KEY + "-muted") === "1";
  }
  function saveMuted(platform, muted) {
    platform.setStorage(STORAGE_KEY + "-muted", muted ? "1" : "0");
  }

  // src/audio.ts
  var AudioSys = class {
    constructor(platform) {
      this.platform = platform;
      this.ctx = null;
      this.lastShoot = 0;
      this.unlocked = false;
      this.muted = loadMuted(platform);
    }
    toggle() {
      this.muted = !this.muted;
      saveMuted(this.platform, this.muted);
      if (!this.muted) this.unlock();
    }
    unlock() {
      if (this.unlocked && this.ctx) return;
      try {
        if (!this.ctx) this.ctx = this.platform.tryAudioContext();
        if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
        this.unlocked = true;
      } catch (e) {
        this.ctx = null;
      }
    }
    play(name) {
      if (this.muted) return;
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      if (name === "shoot") {
        if (t - this.lastShoot < 0.045) return;
        this.lastShoot = t;
        this.blip(t, 880, 0.04, 0.03, "square");
        return;
      }
      if (name === "hit") {
        this.blip(t, 420, 0.06, 0.035, "square");
        return;
      }
      if (name === "gate") {
        this.blip(t, 524, 0.09, 0.05, "sine");
        this.blip(t + 0.07, 660, 0.1, 0.05, "sine");
        return;
      }
      if (name === "red") {
        this.blip(t, 196, 0.16, 0.06, "triangle");
        return;
      }
      if (name === "weapon") {
        this.blip(t, 392, 0.08, 0.05, "sine");
        this.blip(t + 0.08, 523, 0.1, 0.05, "sine");
        this.blip(t + 0.16, 784, 0.12, 0.06, "sine");
        return;
      }
      if (name === "win") {
        this.blip(t, 523, 0.12, 0.05, "sine");
        this.blip(t + 0.12, 659, 0.12, 0.05, "sine");
        this.blip(t + 0.24, 784, 0.2, 0.06, "sine");
        return;
      }
      this.blip(t, 180, 0.22, 0.07, "triangle");
    }
    blip(when, freq, dur, gain, type) {
      const ctx = this.ctx;
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, when);
        g.gain.setValueAtTime(1e-4, when);
        g.gain.exponentialRampToValueAtTime(gain, when + 0.01);
        g.gain.exponentialRampToValueAtTime(1e-4, when + dur);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(when);
        osc.stop(when + dur + 0.02);
      } catch (e) {
      }
    }
  };

  // src/pool.ts
  var Pool = class {
    constructor(max, factory, reset) {
      this.factory = factory;
      this.reset = reset;
      this.idle = [];
      this.live = [];
      this.max = max;
      for (let i = 0; i < max; i++) this.idle.push(factory());
    }
    acquire() {
      var _a;
      if (this.live.length >= this.max) return null;
      const item = (_a = this.idle.pop()) != null ? _a : this.factory();
      this.reset(item);
      this.live.push(item);
      return item;
    }
    release(item) {
      const i = this.live.indexOf(item);
      if (i >= 0) this.live.splice(i, 1);
      this.reset(item);
      if (this.idle.length < this.max) this.idle.push(item);
    }
    releaseAt(index) {
      const item = this.live[index];
      if (!item) return;
      this.live.splice(index, 1);
      this.reset(item);
      if (this.idle.length < this.max) this.idle.push(item);
    }
    clear() {
      while (this.live.length) this.releaseAt(0);
    }
    get active() {
      return this.live;
    }
    get size() {
      return this.live.length;
    }
  };

  // src/bullets.ts
  function resetB(b) {
    b.alive = false;
  }
  var Bullets = class {
    constructor() {
      this.pool = new Pool(MAX_BULLETS, () => ({
        alive: false,
        x: 0,
        y: 0.8,
        z: TEAM_Z,
        damage: 1
      }), resetB);
    }
    clear() {
      this.pool.clear();
    }
    spawn(x, z, damage) {
      const b = this.pool.acquire();
      if (!b) return null;
      b.alive = true;
      b.x = x;
      b.y = 0.85;
      b.z = z + 0.8;
      b.damage = damage;
      return b;
    }
    update(dt) {
      const list = this.pool.active;
      for (let i = list.length - 1; i >= 0; i--) {
        const b = list[i];
        b.z += BULLET_SPEED * dt;
        if (b.z >= BULLET_RANGE_Z || !b.alive) this.pool.releaseAt(i);
      }
    }
  };

  // src/enemies.ts
  function resetE(e) {
    e.alive = false;
    e.hp = 0;
  }
  var Enemies = class {
    constructor() {
      this.pool = new Pool(MAX_ENEMIES, () => ({
        alive: false,
        type: "walker",
        x: 0,
        y: 0,
        z: SPAWN_Z,
        hp: 3,
        maxHp: 3,
        radius: 0.7,
        age: 0,
        dashT: 0,
        dashing: 0,
        walk: 0,
        hitFlash: 0
      }), resetE);
    }
    clear() {
      this.pool.clear();
    }
    spawn(type, lane) {
      const e = this.pool.acquire();
      if (!e) return null;
      const def = ENEMY[type];
      e.alive = true;
      e.type = type;
      const slot = this.pool.size % 3;
      e.x = (lane === "left" ? -LANE_X : LANE_X) + (slot - 1) * 0.62;
      e.y = 0;
      e.z = SPAWN_Z;
      e.hp = def.hp;
      e.maxHp = def.hp;
      e.radius = def.radius;
      e.age = 0;
      e.dashT = type === "sprinter" ? 0.8 : 0;
      e.dashing = 0;
      e.walk = 0;
      e.hitFlash = 0;
      return e;
    }
    update(dt) {
      const list = this.pool.active;
      for (let i = list.length - 1; i >= 0; i--) {
        const e = list[i];
        const def = ENEMY[e.type];
        e.age += dt;
        e.walk += dt * def.speed * 6;
        if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);
        let mul = 1;
        if (e.type === "sprinter") {
          if (e.dashing > 0) {
            e.dashing -= dt;
            mul = ENEMY.sprinter.dashMul;
          } else {
            e.dashT -= dt;
            if (e.dashT <= 0) {
              e.dashing = ENEMY.sprinter.dashDuration;
              e.dashT = ENEMY.sprinter.dashEvery;
            }
          }
        }
        e.z -= BASE_SPEED * def.speed * mul * dt;
        if (e.z < DESPAWN_Z || !e.alive) this.pool.releaseAt(i);
      }
    }
    hurt(e, dmg) {
      e.hp -= dmg;
      e.hitFlash = 0.08;
      if (e.hp <= 0) {
        e.alive = false;
        return true;
      }
      return false;
    }
  };

  // src/gates.ts
  function resetG(g) {
    g.alive = false;
    g.consumed = false;
  }
  var Gates = class {
    constructor() {
      this.pool = new Pool(12, () => ({
        alive: false,
        kind: "add",
        lane: "left",
        x: 0,
        z: SPAWN_Z,
        value: 0,
        weapon: null,
        label: "",
        consumed: false,
        pairKey: 0
      }), resetG);
      this.pairSeq = 1;
    }
    clear() {
      this.pool.clear();
      this.pairSeq = 1;
    }
    /** 同一时刻两道的门使用相同 pairKey，走过一道则另一道消失 */
    spawn(opts) {
      var _a, _b, _c;
      const g = this.pool.acquire();
      if (!g) return null;
      g.alive = true;
      g.kind = opts.kind;
      g.lane = opts.lane;
      g.x = opts.lane === "left" ? -LANE_X : LANE_X;
      g.z = SPAWN_Z;
      g.value = (_a = opts.value) != null ? _a : 0;
      g.weapon = (_b = opts.weapon) != null ? _b : null;
      g.label = opts.label;
      g.consumed = false;
      g.pairKey = (_c = opts.pairKey) != null ? _c : 0;
      return g;
    }
    nextPairKey() {
      return this.pairSeq++;
    }
    update(dt) {
      const list = this.pool.active;
      for (let i = list.length - 1; i >= 0; i--) {
        const g = list[i];
        g.z -= BASE_SPEED * dt;
        if (g.z < DESPAWN_Z || !g.alive) this.pool.releaseAt(i);
      }
    }
    removePair(pairKey) {
      if (!pairKey) return;
      const list = this.pool.active;
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].pairKey === pairKey) this.pool.releaseAt(i);
      }
    }
    overlaps(gate, teamX) {
      return Math.abs(gate.x - teamX) <= LANE_HALF;
    }
  };

  // src/input.ts
  var Input = class {
    constructor(platform) {
      this.platform = platform;
      this.targetX = 0;
      this.dragging = false;
      this.swiped = false;
      this.pointerId = null;
      this.lastX = 0;
      this.keys = /* @__PURE__ */ new Set();
      this.clicks = [];
      platform.onPointerDown((p) => this.down(p));
      platform.onPointerMove((p) => this.move(p));
      platform.onPointerUp((p) => this.up(p));
      platform.onKeyDown((k) => this.keys.add(k));
      platform.onKeyUp((k) => this.keys.delete(k));
    }
    reset() {
      this.targetX = 0;
      this.dragging = false;
      this.swiped = false;
      this.pointerId = null;
      this.keys.clear();
      this.clicks.length = 0;
    }
    consumeClicks() {
      const list = this.clicks.slice();
      this.clicks.length = 0;
      return list;
    }
    update(dt, currentX) {
      const left = this.keys.has("ArrowLeft") || this.keys.has("a") || this.keys.has("A");
      const right = this.keys.has("ArrowRight") || this.keys.has("d") || this.keys.has("D");
      if (left || right) this.swiped = true;
      if (left && !right) this.targetX = Math.max(-LANE_X, this.targetX - LANE_X * 2.4 * dt);
      if (right && !left) this.targetX = Math.min(LANE_X, this.targetX + LANE_X * 2.4 * dt);
      if (!this.dragging && !left && !right) {
      }
      return this.targetX;
    }
    down(p) {
      this.pointerId = p.id;
      this.dragging = true;
      this.lastX = p.x;
      const logic = this.platform.toLogic(p.x, p.y);
      this.clicks.push(logic);
    }
    move(p) {
      if (!this.dragging || this.pointerId !== null && p.id !== this.pointerId) return;
      const dx = p.x - this.lastX;
      this.lastX = p.x;
      if (Math.abs(dx) > 0.4) this.swiped = true;
      const logicDx = dx / this.platform.cssWidth * CANVAS_W;
      this.targetX += logicDx / (CANVAS_W * 0.42) * (LANE_X * 2);
      if (this.targetX > LANE_X) this.targetX = LANE_X;
      if (this.targetX < -LANE_X) this.targetX = -LANE_X;
    }
    up(p) {
      if (this.pointerId !== null && p.id !== this.pointerId) return;
      this.dragging = false;
      this.pointerId = null;
    }
  };

  // src/particles.ts
  function resetP(p) {
    p.alive = false;
    p.life = 0;
  }
  var Particles = class {
    constructor() {
      this.pool = new Pool(80, () => ({
        alive: false,
        kind: "spark",
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        size: 4,
        color: "#fff"
      }), resetP);
    }
    clear() {
      this.pool.clear();
    }
    sparks(x, y, z) {
      for (let i = 0; i < 6; i++) {
        const p = this.pool.acquire();
        if (!p) return;
        p.alive = true;
        p.kind = "spark";
        p.x = x;
        p.y = y + 0.4;
        p.z = z;
        const a = i / 6 * Math.PI * 2;
        p.vx = Math.cos(a) * (2.2 + i % 3 * 0.6);
        p.vy = 3 + i % 2;
        p.vz = Math.sin(a) * 1.4;
        p.maxLife = p.life = 0.16;
        p.size = 5;
        p.color = i % 2 === 0 ? "#FFF4A3" : "#FFFFFF";
      }
    }
    puff(x, y, z, color) {
      for (let i = 0; i < 10; i++) {
        const p = this.pool.acquire();
        if (!p) return;
        p.alive = true;
        p.kind = "puff";
        p.x = x + (i % 5 - 2) * 0.12;
        p.y = y + 0.3;
        p.z = z;
        p.vx = (i % 5 - 2) * 0.9;
        p.vy = 1.4 + i % 3 * 0.7;
        p.vz = (i % 3 - 1) * 0.8;
        p.maxLife = p.life = 0.28;
        p.size = i % 2 === 0 ? 10 : 7;
        p.color = i < 4 ? "#D9DEE8" : color;
      }
    }
    update(dt) {
      const list = this.pool.active;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.vy -= 8 * dt;
        if (p.life <= 0) this.pool.releaseAt(i);
      }
    }
  };

  // src/utils.ts
  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function expDamp(current, target, lambda, dt) {
    return lerp(current, target, 1 - Math.exp(-lambda * dt));
  }
  function project(x, y, z, camX, opts) {
    const t = opts.teamZ / Math.max(z, 0.6);
    const sx = opts.w * 0.5 + (x - camX) * (opts.laneScreen / opts.laneX) * t;
    const groundY = opts.horizonY + (opts.nearY - opts.horizonY) * t;
    const sy = groundY - y * 36 * t;
    return { sx, sy, scale: t, groundY };
  }
  function formatTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  }
  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }
  function drawEllipse(ctx, x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  }

  // src/render.ts
  var PROJ = {
    w: CANVAS_W,
    horizonY: HORIZON_Y,
    nearY: NEAR_Y,
    teamZ: TEAM_Z,
    laneX: LANE_X,
    laneScreen: LANE_SCREEN
  };
  function pr(x, y, z, camX) {
    return project(x, y, z, camX, PROJ);
  }
  var TREE_ZS = [15, 20, 25, 31, 37, 44, 51, 58, 66, 74, 83];
  var HOUSE_ZS = [17, 26, 35, 44, 53, 62, 71, 81];
  function drawWorld(ctx, camX, time, shakeX, shakeY) {
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
  function drawSky(ctx, camX) {
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
  function drawRoad(ctx, camX, time) {
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
    drawDashLine(ctx, 0, camX, "#F3EEDC", 7, time);
  }
  function wrapZ(base, time, minZ, maxZ) {
    const span = maxZ - minZ;
    const raw = base - time * BASE_SPEED;
    return minZ + ((raw - minZ) % span + span) % span;
  }
  function drawDashLine(ctx, x, camX, color, width, time) {
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    const period = 3.2;
    const off = time * BASE_SPEED % period;
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
  function drawRoadside(ctx, camX, time) {
    const props = [];
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
        const id = p.variant === 0 ? "tree_0" : "tree_1";
        drawSprite(ctx, id, q.sx, q.sy + 4 * k, 170 * k, { flip: p.side > 0 });
      } else {
        const x = p.side < 0 ? -ROAD_HALF - 4.35 : ROAD_HALF + 4.45;
        const q = pr(x, 0, p.z, camX);
        const k = q.scale;
        if (k < 0.08) continue;
        const id = "house_" + p.variant;
        drawSprite(ctx, id, q.sx, q.sy + 6 * k, 230 * k, { flip: p.side > 0 });
      }
    }
  }
  function drawGate(ctx, g, camX) {
    const p = pr(g.x, 0, g.z, camX);
    const k = p.scale;
    const id = g.kind === "red" ? "gate_coral" : g.kind === "weapon" ? "gate_gold" : "gate_blue";
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
        drawGateLabel(ctx, g.label, hx, hy, k, g.kind === "red");
      }
      return;
    }
    fallbackGate(ctx, p.sx, p.sy, k, g);
  }
  function drawGateLabel(ctx, label, x, y, k, danger) {
    const fontSize = Math.max(16, (label.length > 2 ? 44 : 54) * k);
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${fontSize}px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif`;
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.lineWidth = Math.max(3, fontSize * 0.14);
    ctx.strokeStyle = danger ? "rgba(110,30,30,0.45)" : "rgba(25,50,110,0.4)";
    ctx.strokeText(label, x, y);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(label, x, y);
    ctx.restore();
  }
  function fallbackGate(ctx, sx, sy, k, g) {
    const w = 148 * k;
    const h = 168 * k;
    const x = sx - w / 2;
    const y = sy - h;
    let frame = "#3B82F6";
    if (g.kind === "red") frame = "#E5736A";
    else if (g.kind === "weapon") frame = "#F0C033";
    ctx.strokeStyle = frame;
    ctx.lineWidth = Math.max(6, 16 * k);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + 10 * k, sy - 8 * k);
    ctx.arc(sx, y + w * 0.15, w * 0.48, Math.PI, 0);
    ctx.lineTo(x + w - 10 * k, sy - 8 * k);
    ctx.stroke();
    if (g.kind === "weapon") return;
    drawGateLabel(ctx, g.label, sx, y + h * 0.5, k, g.kind === "red");
  }
  function drawEnemy(ctx, e, camX) {
    const p = pr(e.x, 0, e.z, camX);
    const def = ENEMY[e.type];
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
    } else {
      const frame = Math.sin(e.walk) >= 0 ? "walker_0" : "walker_1";
      const h = 122 * k;
      if (!drawSprite(ctx, frame, 0, 0, h, { flash })) {
        fallbackEnemy(ctx, k, false, flash);
      }
    }
    ctx.restore();
  }
  function fallbackEnemy(ctx, k, sprint, flash) {
    ctx.fillStyle = flash > 0 ? "#FFFFFF" : sprint ? "#7BA24A" : "#9FD6B0";
    drawEllipse(ctx, 0, -28 * k, sprint ? 16 * k : 22 * k, sprint ? 22 * k : 24 * k);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, sprint ? -52 * k : -56 * k, sprint ? 13 * k : 16 * k, 0, Math.PI * 2);
    ctx.fill();
  }
  function drawSoldier(ctx, sx, sy, scale, bob, flash, weapon) {
    const k = scale;
    const bounce = Math.sin(bob) * 2.6 * k;
    const frame = Math.sin(bob) >= 0 ? 0 : 1;
    const id = weapon === "smg" ? frame === 0 ? "soldier_smg_0" : "soldier_smg_1" : frame === 0 ? "soldier_pistol_0" : "soldier_pistol_1";
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
    const rate = weapon === "smg" ? 7.2 : 3.4;
    if (Math.sin(bob * rate) > 0.55) {
      const mz = muzzleOf(id);
      const mx = (mz[0] - 0.5) * size.w;
      const my = -h + mz[1] * h;
      drawMuzzleFlash(ctx, mx, my, k * (weapon === "smg" ? 1.15 : 1));
    }
    ctx.restore();
  }
  function drawMuzzleFlash(ctx, x, y, k) {
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
  function drawStar(ctx, x, y, n, outer, inner) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = i * Math.PI / n - Math.PI / 2;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  function squadVisualScale(n) {
    if (n <= 1) return 1.36;
    if (n <= 2) return 1.05;
    if (n <= 4) return 0.82;
    if (n <= 8) return 0.68;
    if (n <= 15) return 0.58;
    return 0.5;
  }
  function drawSquad(ctx, squad, camX) {
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
  function drawBullet(ctx, b, camX) {
    const p = pr(b.x, b.y, b.z, camX);
    const k = p.scale;
    ctx.save();
    ctx.translate(p.sx, p.sy);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 10 * k);
    glow.addColorStop(0, "rgba(255,240,170,0.7)");
    glow.addColorStop(1, "rgba(255,220,80,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 10 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#F7E08A";
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.2 * k, 8 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFF8D2";
    ctx.beginPath();
    ctx.ellipse(0, -2 * k, 1.6 * k, 3.2 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function drawParticle(ctx, p, camX) {
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
  function drawHud(ctx, hud) {
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
    ctx.fillText("\xD7 " + hud.count, 132, 80);
    const wname = WEAPONS[hud.weapon].name;
    const extra = hud.weapon === "smg" ? "  " + Math.ceil(Math.max(0, hud.weaponTime)) + "s" : "";
    const midW = 230;
    const midX = (CANVAS_W - midW) / 2;
    pill(ctx, midX, 48, midW, 60, hud.weapon === "smg" ? "rgba(255,236,190,0.96)" : "rgba(255,248,230,0.94)");
    const iconId = hud.weapon === "smg" ? "icon_smg" : "icon_pistol";
    drawSprite(ctx, iconId, midX + 36, 108, 36);
    ctx.fillStyle = "#5A3E22";
    ctx.font = 'bold 24px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(wname + extra, midX + 62, 79);
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
      ctx.fillText("\u5C04\u901F\u63D0\u5347 " + hud.fireBonus.toFixed(1) + "s", 52, 141);
    }
    drawMute(ctx, hud.muted);
    if (hud.hint) {
      pill(ctx, 70, CANVAS_H - 210, CANVAS_W - 140, 72, "rgba(40,32,24,0.72)");
      ctx.fillStyle = "#FFFFFF";
      ctx.font = 'bold 22px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("\u5DE6\u53F3\u6ED1\u52A8 \xB7 \u81EA\u52A8\u5F00\u706B \xB7 \u7A7F\u84DD\u95E8\u52A0\u4EBA", CANVAS_W / 2, CANVAS_H - 172);
    }
  }
  function pill(ctx, x, y, w, h, color) {
    ctx.fillStyle = "rgba(90,60,30,0.12)";
    roundRect(ctx, x, y + 3, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.fill();
  }
  function drawClockIcon(ctx, x, y, r) {
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
  function hitMute(x, y) {
    const dx = x - (CANVAS_W - 56);
    const dy = y - 150;
    return dx * dx + dy * dy <= 26 * 26;
  }
  function drawMute(ctx, muted) {
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
    ctx.fillText(muted ? "\u9759\u97F3" : "\u97F3\u6548", CANVAS_W - 56, 151);
  }
  function drawTitle(ctx, best, muted = false) {
    dim(ctx);
    drawMute(ctx, muted);
    ctx.fillStyle = "rgba(255,248,230,0.96)";
    roundRect(ctx, 80, 280, CANVAS_W - 160, 520, 28);
    ctx.fill();
    ctx.fillStyle = "#5A3E22";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = 'bold 58px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
    ctx.fillText("\u8DEF\u53E3\u706B\u529B", CANVAS_W / 2, 380);
    ctx.font = '22px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillStyle = "rgba(90,62,34,0.8)";
    ctx.fillText("\u81EA\u52A8\u5F00\u706B \xB7 \u7A7F\u95E8\u96C6\u7ED3", CANVAS_W / 2, 430);
    drawButton(ctx, CANVAS_W / 2 - 140, 560, 280, 80, "#6B8F3A", "\u5F00\u59CB\u6E38\u620F");
    ctx.fillStyle = "rgba(90,62,34,0.8)";
    ctx.font = '20px "PingFang SC","Microsoft YaHei",sans-serif';
    if (best.kills > 0 || best.peakCount > 0) {
      ctx.fillText(
        "\u6700\u9AD8\u51FB\u6740 " + best.kills + "  \xB7  \u6700\u9AD8\u4EBA\u6570 " + best.peakCount + "  \xB7  \u6700\u957F\u575A\u6301 " + formatTime(best.time),
        CANVAS_W / 2,
        700
      );
    } else {
      ctx.fillText("\u672C\u5730\u8BB0\u5F55\u5C06\u5728\u672C\u673A\u4FDD\u5B58", CANVAS_W / 2, 700);
    }
    ctx.font = '18px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillStyle = "rgba(255,248,230,0.86)";
    ctx.fillText("\u9690\u79C1\u653F\u7B56  |  \u9002\u9F84\u63D0\u793A", CANVAS_W / 2, CANVAS_H - 80);
  }
  function titleHit(x, y) {
    if (x >= CANVAS_W / 2 - 140 && x <= CANVAS_W / 2 + 140 && y >= 560 && y <= 640) return "start";
    if (y >= CANVAS_H - 110 && y <= CANVAS_H - 50) return "legal";
    return null;
  }
  function drawLegal(ctx) {
    dim(ctx);
    ctx.fillStyle = "rgba(255,248,230,0.97)";
    roundRect(ctx, 70, 280, CANVAS_W - 140, 640, 22);
    ctx.fill();
    ctx.fillStyle = "#5A3E22";
    ctx.textAlign = "center";
    ctx.font = 'bold 30px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText("\u9690\u79C1\u653F\u7B56\u4E0E\u9002\u9F84\u63D0\u793A", CANVAS_W / 2, 350);
    ctx.font = '20px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillStyle = "rgba(90,62,34,0.88)";
    const lines = [
      "\u672C\u9875\u4E3A\u5360\u4F4D\u8BF4\u660E\uFF0C\u6B63\u5F0F\u4E0A\u67B6\u524D\u5C06\u66FF\u6362\u4E3A\u5B8C\u6574\u6587\u6848\u3002",
      "\u672C\u6E38\u620F\u4E3A\u4F11\u95F2\u5C04\u51FB\uFF0C\u9002\u5408 12 \u5C81\u53CA\u4EE5\u4E0A\u73A9\u5BB6\u3002",
      "\u4E0D\u6536\u96C6\u4E2A\u4EBA\u8EAB\u4EFD\u4FE1\u606F\uFF0C\u6210\u7EE9\u4EC5\u4FDD\u5B58\u5728\u672C\u5730\u3002",
      "\u4E0D\u542B\u5185\u8D2D\u3002\u5E7F\u544A\u80FD\u529B\u672C\u7248\u672C\u5173\u95ED\u3002",
      "\u8BF7\u5408\u7406\u5B89\u6392\u6E38\u620F\u65F6\u95F4\u3002"
    ];
    let y = 420;
    for (const line of lines) {
      wrapText(ctx, line, CANVAS_W / 2, y, CANVAS_W - 220, 32);
      y += 70;
    }
    drawButton(ctx, CANVAS_W / 2 - 110, 800, 220, 64, "#6B8F3A", "\u8FD4\u56DE");
  }
  function legalHit(x, y) {
    return x >= CANVAS_W / 2 - 110 && x <= CANVAS_W / 2 + 110 && y >= 800 && y <= 864;
  }
  function drawResult(ctx, kills, time, peak, best) {
    dim(ctx);
    ctx.fillStyle = "rgba(255,248,230,0.96)";
    roundRect(ctx, 80, 250, CANVAS_W - 160, 620, 28);
    ctx.fill();
    ctx.fillStyle = "#5A3E22";
    ctx.textAlign = "center";
    ctx.font = 'bold 48px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText("\u672C\u5C40\u7ED3\u675F", CANVAS_W / 2, 340);
    ctx.font = '22px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillStyle = "rgba(90,62,34,0.85)";
    ctx.fillText("\u4EBA\u6570\u5F52\u96F6 \xB7 \u6BD4\u6BD4\u8C01\u575A\u6301\u5F97\u66F4\u4E45", CANVAS_W / 2, 400);
    const rows = [
      ["\u575A\u6301\u65F6\u95F4", formatTime(time)],
      ["\u51FB\u6740", String(kills)],
      ["\u672C\u5C40\u6700\u9AD8\u4EBA\u6570", String(peak)],
      ["\u6700\u957F\u575A\u6301", formatTime(best.time)],
      ["\u5386\u53F2\u6700\u9AD8\u51FB\u6740", String(best.kills)],
      ["\u5386\u53F2\u6700\u9AD8\u4EBA\u6570", String(best.peakCount)]
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
    drawButton(ctx, CANVAS_W / 2 - 140, 740, 280, 80, "#6B8F3A", "\u518D\u6765\u4E00\u5C40");
  }
  function resultHit(x, y) {
    return x >= CANVAS_W / 2 - 140 && x <= CANVAS_W / 2 + 140 && y >= 740 && y <= 820;
  }
  function drawButton(ctx, x, y, w, h, color, label) {
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
  function dim(ctx) {
    ctx.fillStyle = "rgba(30,22,16,0.48)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
  function wrapText(ctx, text, x, y, maxW, lineH) {
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

  // src/squad.ts
  function rowCountFor(n) {
    if (n <= 2) return 1;
    if (n <= 8) return 2;
    if (n <= 15) return 3;
    return 4;
  }
  function layout(n) {
    const count = Math.max(0, Math.min(MAX_SQUAD, n));
    if (count === 0) return [];
    const rows = rowCountFor(count);
    const base = Math.floor(count / rows);
    const extra = count % rows;
    const counts = [];
    for (let r = 0; r < rows; r++) counts.push(base + (r < extra ? 1 : 0));
    const spacingX = 0.7;
    const spacingZ = 0.72;
    const out = [];
    const zFront = (rows - 1) * spacingZ / 2;
    for (let r = 0; r < rows; r++) {
      const z = rows === 1 ? 0.15 : zFront - r * spacingZ;
      const c = counts[r];
      const start = -((c - 1) * spacingX) / 2;
      for (let i = 0; i < c; i++) out.push({ x: start + i * spacingX, z });
    }
    return out;
  }
  function resetS(s) {
    s.alive = false;
    s.flash = 0;
    s.bob = 0;
  }
  var Squad = class {
    constructor() {
      this.x = 0;
      this.z = TEAM_Z;
      this.count = 1;
      this.peak = 1;
      this.weapon = "pistol";
      this.weaponTime = 0;
      this.iframes = 0;
      this.fireBonus = 0;
      this.fireCd = 0;
      this.pool = new Pool(MAX_SQUAD, () => ({
        alive: false,
        slot: 0,
        flash: 0,
        bob: 0
      }), resetS);
    }
    reset() {
      this.x = 0;
      this.z = TEAM_Z;
      this.count = 1;
      this.peak = 1;
      this.weapon = "pistol";
      this.weaponTime = 0;
      this.iframes = 0;
      this.fireBonus = 0;
      this.fireCd = 0;
      this.pool.clear();
      this.syncMembers();
    }
    get fireMul() {
      return this.fireBonus > 0 ? OVERFLOW_BONUS_MUL : 1;
    }
    get weaponDef() {
      return WEAPONS[this.weapon];
    }
    slotOf(index) {
      var _a, _b;
      const slots = layout(this.count);
      return (_b = (_a = slots[index]) != null ? _a : slots[0]) != null ? _b : { x: 0, z: 0 };
    }
    setCount(n) {
      this.count = clamp(n, 0, MAX_SQUAD);
      if (this.count > this.peak) this.peak = this.count;
      this.syncMembers();
    }
    /** 加人 / 倍增，超出 20 的部分转为 3 秒射速加成 */
    grow(next) {
      const overflow = Math.max(0, next - MAX_SQUAD);
      const applied = Math.min(MAX_SQUAD, Math.max(0, next));
      this.setCount(applied);
      if (overflow > 0) this.fireBonus = OVERFLOW_BONUS_DURATION;
      return { applied, overflow };
    }
    add(n) {
      return this.grow(this.count + n);
    }
    mul(n) {
      return this.grow(this.count * n);
    }
    lose(n) {
      this.setCount(Math.max(0, this.count - n));
      this.iframes = HIT_IFRAMES;
      for (const s of this.pool.active) s.flash = 0.22;
    }
    equip(id) {
      this.weapon = id;
      this.weaponTime = WEAPONS[id].duration === Infinity ? 0 : WEAPONS[id].duration;
    }
    update(dt, targetX) {
      this.x = expDamp(this.x, clamp(targetX, -LANE_X, LANE_X), 10, dt);
      if (this.iframes > 0) this.iframes = Math.max(0, this.iframes - dt);
      if (this.fireBonus > 0) this.fireBonus = Math.max(0, this.fireBonus - dt);
      if (this.weapon !== "pistol") {
        this.weaponTime -= dt;
        if (this.weaponTime <= 0) {
          this.weapon = "pistol";
          this.weaponTime = 0;
        }
      }
      const list = this.pool.active;
      for (let i = 0; i < list.length; i++) {
        const s = list[i];
        s.bob += dt * 8;
        if (s.flash > 0) s.flash = Math.max(0, s.flash - dt);
      }
    }
    /** 每次齐射：每个小兵从自己的位置发出一发，互不重叠到同一条弹道 */
    tryFire(dt) {
      if (this.count <= 0) return [];
      const def = this.weaponDef;
      const rate = def.rate * this.fireMul;
      this.fireCd -= dt;
      if (this.fireCd > 0) return [];
      this.fireCd += 1 / Math.max(rate, 0.01);
      const shots = [];
      for (let i = 0; i < this.count; i++) {
        const slot = this.slotOf(i);
        shots.push({
          damage: def.damage,
          x: this.x + slot.x,
          z: this.z + slot.z
        });
      }
      return shots;
    }
    syncMembers() {
      this.pool.clear();
      for (let i = 0; i < this.count; i++) {
        const s = this.pool.acquire();
        if (!s) break;
        s.alive = true;
        s.slot = i;
        s.flash = 0;
        s.bob = i * 0.4;
      }
    }
  };

  // src/game.ts
  var Game = class {
    constructor(platform) {
      this.platform = platform;
      this.state = "title";
      this.time = 0;
      this.timeScale = 1;
      this.animTime = 0;
      this.kills = 0;
      this.hint = true;
      this.hintTimer = 0;
      this.shake = 0;
      this.squad = new Squad();
      this.enemies = new Enemies();
      this.bullets = new Bullets();
      this.gates = new Gates();
      this.particles = new Particles();
      this.cursor = 0;
      this.pendingPairs = /* @__PURE__ */ new Map();
      this.nextHordeAt = 0;
      this.nextGateAt = 0;
      this.endlessGateI = 0;
      this.hordeSkipUntil = 0;
      this.paused = false;
      this.running = false;
      this.lastTs = 0;
      this.rafId = 0;
      /** 记录各事件是否已生成，供测试查询 */
      this.spawned = [];
      this.input = new Input(platform);
      this.audio = new AudioSys(platform);
      this.best = loadBest(platform);
      this.squad.reset();
      platform.onResize(() => platform.layout());
    }
    startLoop() {
      if (this.running) return;
      this.running = true;
      this.lastTs = this.platform.now();
      const tick = () => {
        const now = this.platform.now();
        let dt = (now - this.lastTs) / 1e3;
        this.lastTs = now;
        if (dt > 0.05) dt = 0.05;
        if (!this.paused) {
          const scaled = dt * this.timeScale;
          this.animTime += scaled;
          this.update(scaled);
        }
        this.draw();
        this.rafId = this.platform.raf(tick);
      };
      this.rafId = this.platform.raf(tick);
    }
    /** 供测试：推进逻辑而不依赖 rAF */
    step(dt) {
      const slice = 1 / 60;
      let left = dt;
      while (left > 0) {
        const d = Math.min(slice, left);
        this.update(d * this.timeScale);
        left -= d;
      }
    }
    getState() {
      return {
        state: this.state,
        time: this.time,
        squadCount: this.squad.count,
        weapon: this.squad.weapon,
        weaponTime: this.squad.weaponTime,
        kills: this.kills,
        peak: this.squad.peak,
        fireBonus: this.squad.fireBonus,
        iframes: this.squad.iframes,
        hint: this.hint,
        gates: this.gates.pool.active.map((g) => ({
          lane: g.lane,
          kind: g.kind,
          label: g.label,
          z: g.z,
          timeAppeared: 0
        })),
        enemies: this.enemies.pool.active.map((e) => ({
          type: e.type,
          z: e.z,
          hp: e.hp
        })),
        bullets: this.bullets.pool.size,
        remain: this.time
      };
    }
    beginRun() {
      this.state = "playing";
      this.time = 0;
      this.kills = 0;
      this.hint = true;
      this.hintTimer = 0;
      this.shake = 0;
      this.cursor = 0;
      this.pendingPairs.clear();
      this.nextHordeAt = SCRIPT_ENEMY_END + 0.28;
      this.nextGateAt = ENDLESS_GATE_START;
      this.endlessGateI = 0;
      this.hordeSkipUntil = 0;
      this.spawned.length = 0;
      this.squad.reset();
      this.enemies.clear();
      this.bullets.clear();
      this.gates.clear();
      this.particles.clear();
      this.squad.x = LANE_X;
      this.input.targetX = LANE_X;
      this.input.swiped = false;
      ads.enabled = false;
    }
    update(dt) {
      const clicks = this.input.consumeClicks();
      for (const c of clicks) this.handleClick(c.x, c.y);
      if (this.state !== "playing") return;
      this.time += dt;
      this.hintTimer += dt;
      if (this.input.swiped || this.hintTimer >= 3) {
        if (this.input.swiped) this.hint = false;
        else if (this.hintTimer >= 3) this.hint = false;
      }
      const target = this.input.update(dt, this.squad.x);
      this.squad.update(dt, target);
      this.spawnDue();
      this.spawnEndless();
      this.gates.update(dt);
      this.enemies.update(dt);
      this.shoot(dt);
      this.bullets.update(dt);
      this.collideBullets();
      this.collideGates();
      this.collideEnemies();
      this.particles.update(dt);
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
      if (this.squad.count <= 0) {
        this.endRun();
        return;
      }
    }
    spawnDue() {
      while (this.cursor < TIMELINE.length && TIMELINE[this.cursor].time <= this.time) {
        const ev = TIMELINE[this.cursor++];
        this.applyEvent(ev);
        this.spawned.push(ev);
      }
    }
    /** 脚本段结束后继续出怪和补门，直到人数归零 */
    spawnEndless() {
      while (this.time >= this.nextHordeAt) {
        const t = this.nextHordeAt;
        if (t >= this.hordeSkipUntil) {
          this.enemies.spawn("walker", "right");
          this.enemies.spawn("sprinter", "right");
        }
        this.nextHordeAt += endlessHordeInterval(t);
      }
      while (this.time >= this.nextGateAt) {
        const t = this.nextGateAt;
        const ev = ENDLESS_GATE_CYCLE[this.endlessGateI % ENDLESS_GATE_CYCLE.length];
        const pair = this.endlessGateI % 4 === 3;
        const pairKey = pair ? this.gates.nextPairKey() : 0;
        this.gates.spawn({
          kind: ev.gate,
          lane: ev.lane,
          value: ev.value,
          weapon: ev.weapon,
          label: ev.label || "",
          pairKey
        });
        if (pair) {
          this.gates.spawn({
            kind: "red",
            lane: "right",
            value: 3,
            label: "-3",
            pairKey
          });
          this.hordeSkipUntil = t + 1.3;
        }
        this.endlessGateI += 1;
        this.nextGateAt += ENDLESS_GATE_PERIOD;
      }
    }
    applyEvent(ev) {
      var _a;
      if (ev.kind === "enemy" && ev.enemy) {
        this.enemies.spawn(ev.enemy, ev.lane);
        return;
      }
      if (ev.kind === "gate" && ev.gate) {
        const tKey = Math.round(ev.time * 100);
        let pairKey = (_a = this.pendingPairs.get(tKey)) != null ? _a : 0;
        const sameTimeOther = TIMELINE.some(
          (o, i) => i !== this.cursor - 1 && o.kind === "gate" && Math.abs(o.time - ev.time) < 1e-3
        );
        if (sameTimeOther) {
          if (!pairKey) {
            pairKey = this.gates.nextPairKey();
            this.pendingPairs.set(tKey, pairKey);
          }
        }
        this.gates.spawn({
          kind: ev.gate,
          lane: ev.lane,
          value: ev.value,
          weapon: ev.weapon,
          label: ev.label || "",
          pairKey
        });
      }
    }
    shoot(dt) {
      const shots = this.squad.tryFire(dt);
      if (!shots.length) return;
      const room = Math.max(0, this.bullets.pool.max - this.bullets.pool.size);
      if (room <= 0) return;
      const n = Math.min(shots.length, room);
      const damage = shots[0].damage * (shots.length / n);
      let any = false;
      for (let i = 0; i < n; i++) {
        const src = shots[Math.floor(i * shots.length / n)];
        if (this.bullets.spawn(src.x, src.z, damage)) any = true;
      }
      if (any) this.audio.play("shoot");
    }
    collideBullets() {
      const bullets = this.bullets.pool.active;
      const enemies = this.enemies.pool.active;
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        let hitIndex = -1;
        let bestZ = Infinity;
        for (let j = 0; j < enemies.length; j++) {
          const e = enemies[j];
          if (Math.abs(e.x - b.x) <= e.radius + 0.55 && Math.abs(e.z - b.z) <= 1.4) {
            if (e.z < bestZ) {
              bestZ = e.z;
              hitIndex = j;
            }
          }
        }
        if (hitIndex >= 0) {
          const e = enemies[hitIndex];
          this.particles.sparks(e.x, 0.6, e.z);
          this.audio.play("hit");
          const dead = this.enemies.hurt(e, b.damage);
          this.bullets.pool.release(b);
          if (dead) {
            const color = e.type === "sprinter" ? "#7BA24A" : "#A8D9B8";
            this.particles.puff(e.x, 0.4, e.z, color);
            this.kills += 1;
          }
        }
      }
    }
    collideGates() {
      const list = this.gates.pool.active.slice();
      for (const g of list) {
        if (!g || !this.gates.pool.active.includes(g)) continue;
        if (g.z > TEAM_Z + 0.6) continue;
        if (this.gates.overlaps(g, this.squad.x) && !g.consumed) {
          g.consumed = true;
          const pair = g.pairKey;
          this.applyGate(g);
          this.gates.pool.release(g);
          if (pair) this.gates.removePair(pair);
        } else if (g.z <= TEAM_Z - 0.8) {
          this.gates.pool.release(g);
        }
      }
    }
    applyGate(g) {
      if (g.kind === "add") {
        this.squad.add(g.value);
        this.audio.play("gate");
      } else if (g.kind === "mul") {
        this.squad.mul(g.value);
        this.audio.play("gate");
      } else if (g.kind === "red") {
        this.squad.lose(g.value);
        this.shake = 0.22;
        this.audio.play("red");
      } else if (g.kind === "weapon" && g.weapon) {
        this.squad.equip(g.weapon === "smg" ? "smg" : "pistol");
        this.audio.play("weapon");
      }
    }
    collideEnemies() {
      if (this.squad.count <= 0) return;
      const list = this.enemies.pool.active;
      for (let i = list.length - 1; i >= 0; i--) {
        const e = list[i];
        if (e.z > TEAM_Z + 1.1) continue;
        const dx = Math.abs(e.x - this.squad.x);
        if (dx > LANE_X * 0.85) {
          if (e.z < TEAM_Z - 0.6) {
          }
          continue;
        }
        if (e.z <= TEAM_Z + 1.1 && e.z >= TEAM_Z - 1.4) {
          if (this.squad.iframes > 0) {
            this.particles.puff(e.x, 0.4, e.z, e.type === "sprinter" ? "#7BA24A" : "#A8D9B8");
            this.enemies.pool.release(e);
            continue;
          }
          this.squad.lose(1);
          this.shake = 0.28;
          this.particles.puff(e.x, 0.4, e.z, e.type === "sprinter" ? "#7BA24A" : "#A8D9B8");
          this.audio.play("red");
          this.enemies.pool.release(e);
          if (this.squad.count <= 0) return;
        }
      }
    }
    endRun() {
      this.state = "fail";
      this.best = saveBest(
        this.platform,
        { kills: this.kills, peakCount: this.squad.peak, time: this.time },
        this.best
      );
      this.audio.play("fail");
    }
    handleClick(x, y) {
      this.audio.unlock();
      if (this.state === "playing") {
        if (hitMute(x, y)) this.audio.toggle();
        return;
      }
      if (this.state === "title") {
        if (hitMute(x, y)) {
          this.audio.toggle();
          return;
        }
        const hit = titleHit(x, y);
        if (hit === "start") this.beginRun();
        else if (hit === "legal") this.state = "legal";
        return;
      }
      if (this.state === "legal") {
        if (legalHit(x, y)) this.state = "title";
        return;
      }
      if (this.state === "win" || this.state === "fail") {
        if (resultHit(x, y)) this.beginRun();
      }
    }
    drawFrame() {
      this.draw();
    }
    draw() {
      beginFrame(this.platform);
      const ctx = this.platform.ctx;
      const camX = this.squad.x * 0.32;
      const sh = this.shake > 0 ? (Math.random() * 2 - 1) * 10 * this.shake : 0;
      const sv = this.shake > 0 ? (Math.random() * 2 - 1) * 8 * this.shake : 0;
      drawWorld(ctx, camX, this.animTime, sh, sv);
      const items = [];
      for (const g of this.gates.pool.active) {
        items.push({ z: g.z, draw: () => drawGate(ctx, g, camX) });
      }
      for (const e of this.enemies.pool.active) {
        items.push({ z: e.z, draw: () => drawEnemy(ctx, e, camX) });
      }
      for (const b of this.bullets.pool.active) {
        items.push({ z: b.z, draw: () => drawBullet(ctx, b, camX) });
      }
      for (const p of this.particles.pool.active) {
        items.push({ z: p.z, draw: () => drawParticle(ctx, p, camX) });
      }
      items.sort((a, b) => b.z - a.z);
      ctx.save();
      ctx.translate(sh, sv);
      for (const it of items) it.draw();
      drawSquad(ctx, this.squad, camX);
      ctx.restore();
      if (this.state === "playing") {
        drawHud(ctx, {
          count: this.squad.count,
          weapon: this.squad.weapon === "smg" ? "smg" : "pistol",
          weaponTime: this.squad.weaponTime,
          remain: this.time,
          fireBonus: this.squad.fireBonus,
          muted: this.audio.muted,
          hint: this.hint
        });
      } else if (this.state === "title") {
        drawTitle(ctx, this.best, this.audio.muted);
      } else if (this.state === "legal") {
        drawLegal(ctx);
      } else {
        drawResult(ctx, this.kills, this.time, this.squad.peak, this.best);
      }
    }
  };

  // src/main.ts
  function attachHooks(game) {
    const hooks = {
      game,
      start: () => game.beginRun(),
      getState: () => game.getState(),
      step: (dt) => game.step(dt),
      setTimeScale: (n) => {
        game.timeScale = n;
      },
      setPaused: (v) => {
        game.paused = v;
      },
      draw: () => game.drawFrame()
    };
    globalThis.__LUKOU__ = hooks;
    return hooks;
  }
  function boot(platform) {
    const plat = platform != null ? platform : createPlatform();
    const game = new Game(plat);
    attachHooks(game);
    void preloadAssets();
    game.startLoop();
    return game;
  }
  function shouldAutoBoot() {
    if (typeof wx !== "undefined" && typeof wx.createCanvas === "function") return true;
    if (typeof document !== "undefined") return true;
    return false;
  }
  if (shouldAutoBoot()) {
    boot();
  }
})();
//# sourceMappingURL=game.js.map
