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
  var MAX_BULLETS = 40;
  var MAX_ENEMIES = 25;
  var MAX_SQUAD = 20;
  var VISUAL_FIRE_CAP = 18;
  var RUN_DURATION = 90;
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
  var TIMELINE = [
    // —— 0–10 秒教学 ——
    { time: 2, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 3, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 4, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 5, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 6, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 6, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
    { time: 7.25, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "\u51B2\u950B\u67AA" },
    // —— 10–40 秒：左道 +N / ×2 / 武器门，右道小股游走体 ——
    { time: 11.5, kind: "gate", lane: "left", gate: "add", value: 2, label: "+2" },
    { time: 12, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 13.1, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 14.2, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 16, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "\u51B2\u950B\u67AA" },
    { time: 17.5, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 18.6, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 19.7, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 20.8, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 22, kind: "gate", lane: "left", gate: "mul", value: 2, label: "\xD72" },
    { time: 24, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 25.2, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 26.4, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 27, kind: "gate", lane: "left", gate: "add", value: 5, label: "+5" },
    { time: 30, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 31.2, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 32.4, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 33.6, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 32.8, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
    { time: 36.5, kind: "gate", lane: "left", gate: "add", value: 8, label: "+8" },
    { time: 36.8, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 38, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 39.2, kind: "enemy", lane: "right", enemy: "walker" },
    // —— 40–70 秒：混入冲刺体，约 40 秒后出现红门 -3 ——
    { time: 40.5, kind: "gate", lane: "right", gate: "red", value: 3, label: "-3" },
    { time: 40.5, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
    { time: 44, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 45, kind: "enemy", lane: "right", enemy: "sprinter" },
    { time: 46.1, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 47, kind: "enemy", lane: "right", enemy: "sprinter" },
    { time: 48.5, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "\u51B2\u950B\u67AA" },
    { time: 51, kind: "gate", lane: "left", gate: "add", value: 5, label: "+5" },
    { time: 52, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 53, kind: "enemy", lane: "right", enemy: "sprinter" },
    { time: 54, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 55, kind: "enemy", lane: "right", enemy: "sprinter" },
    { time: 58, kind: "gate", lane: "left", gate: "red", value: 3, label: "-3" },
    { time: 60, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 61, kind: "enemy", lane: "right", enemy: "sprinter" },
    { time: 62, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 63.2, kind: "enemy", lane: "right", enemy: "sprinter" },
    { time: 62.5, kind: "gate", lane: "left", gate: "add", value: 8, label: "+8" },
    { time: 67, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "\u51B2\u950B\u67AA" },
    { time: 66, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 67, kind: "enemy", lane: "right", enemy: "sprinter" },
    { time: 68.2, kind: "enemy", lane: "right", enemy: "walker" },
    // —— 70–90 秒：不再出加人门，收束波 ——
    { time: 72, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 72.9, kind: "enemy", lane: "right", enemy: "sprinter" },
    { time: 73.8, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 74.7, kind: "enemy", lane: "right", enemy: "sprinter" },
    { time: 75.6, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 76.5, kind: "enemy", lane: "right", enemy: "sprinter" },
    { time: 80, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 80.8, kind: "enemy", lane: "right", enemy: "sprinter" },
    { time: 81.6, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 82.4, kind: "enemy", lane: "right", enemy: "sprinter" },
    { time: 83.2, kind: "enemy", lane: "right", enemy: "walker" },
    { time: 84, kind: "enemy", lane: "right", enemy: "sprinter" }
  ];
  var FINAL_WAVE_LAST_SPAWN = 84;

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
      e.x = lane === "left" ? -LANE_X : LANE_X;
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
    const s = Math.max(0, Math.ceil(sec));
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
  var TREE_ZS = [20, 26, 32, 38, 44, 50, 56, 64, 72];
  var LAMP_ZS = [23, 35, 47, 59];
  function drawWorld(ctx, camX, time, shakeX, shakeY) {
    ctx.save();
    ctx.translate(shakeX, shakeY);
    const sky = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 80);
    sky.addColorStop(0, "#8FD3F4");
    sky.addColorStop(0.55, "#B9E4F8");
    sky.addColorStop(1, "#F8E6C8");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "#FFE27A";
    ctx.beginPath();
    ctx.arc(560, 150, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,226,122,0.28)";
    ctx.beginPath();
    ctx.arc(560, 150, 78, 0, Math.PI * 2);
    ctx.fill();
    drawCloud(ctx, 140, 110, 1, time);
    drawCloud(ctx, 400, 80, 0.8, time * 0.7 + 10);
    drawCloud(ctx, 620, 130, 0.7, time * 0.5 + 4);
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
    const grass = ctx.createLinearGradient(0, HORIZON_Y, 0, CANVAS_H);
    grass.addColorStop(0, "#8ED48A");
    grass.addColorStop(1, "#5EAE62");
    ctx.fillStyle = grass;
    ctx.fillRect(0, HORIZON_Y + 18, CANVAS_W, CANVAS_H - HORIZON_Y);
    drawRoad(ctx, camX, time);
    const trees = TREE_ZS.map((z) => ({ side: -1, z: wrapZ(z, time, 12, 76), s: 1 })).concat(TREE_ZS.map((z) => ({ side: 1, z: wrapZ(z + 3, time, 12, 76), s: 0.9 }))).sort((a, b) => b.z - a.z);
    for (const t of trees) {
      const x = t.side < 0 ? -ROAD_HALF - 2.2 : ROAD_HALF + 2.4;
      drawTree(ctx, x, t.z, camX, t.s);
    }
    const lamps = LAMP_ZS.map((z) => ({ side: -1, z: wrapZ(z, time, 12, 76) })).concat(LAMP_ZS.map((z) => ({ side: 1, z: wrapZ(z + 6, time, 12, 76) }))).sort((a, b) => b.z - a.z);
    for (const l of lamps) {
      const x = l.side < 0 ? -ROAD_HALF - 1.2 : ROAD_HALF + 1.2;
      drawLamp(ctx, x, l.z, camX);
    }
    ctx.restore();
  }
  function drawCloud(ctx, x, y, s, t) {
    const ox = t * 4 % 40;
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    drawEllipse(ctx, x + ox, y, 46 * s, 22 * s);
    ctx.fill();
    drawEllipse(ctx, x + ox + 30 * s, y + 4, 32 * s, 18 * s);
    ctx.fill();
    drawEllipse(ctx, x + ox - 28 * s, y + 6, 28 * s, 16 * s);
    ctx.fill();
  }
  function drawRoad(ctx, camX, time) {
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
    drawDashLine(ctx, 0, camX, "#F5F0D8", 6, time);
    ctx.globalAlpha = 0.2;
    fillLaneBand(ctx, -LANE_X, camX, "#5B9BFF");
    fillLaneBand(ctx, LANE_X, camX, "#E8A23A");
    ctx.globalAlpha = 1;
  }
  function fillLaneBand(ctx, x, camX, color) {
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
  function drawTree(ctx, x, z, camX, s) {
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
  function drawLamp(ctx, x, z, camX) {
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
  function drawGate(ctx, g, camX) {
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
    ctx.fillStyle = frame;
    roundRect(ctx, x - 8 * k, y, 14 * k, h + 4 * k, 4 * k);
    ctx.fill();
    roundRect(ctx, x + w - 6 * k, y, 14 * k, h + 4 * k, 4 * k);
    ctx.fill();
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
  function drawEnemy(ctx, e, camX) {
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
    ctx.fillStyle = bodyDark;
    ctx.fillRect(-10 * k + walk, -14 * k, 8 * k, 14 * k);
    ctx.fillRect(3 * k - walk, -14 * k, 8 * k, 14 * k);
    ctx.fillStyle = flash ? "#FFFFFF" : body;
    if (e.type === "sprinter") {
      drawEllipse(ctx, 0, -28 * k, 16 * k, 22 * k);
      ctx.fill();
    } else {
      drawEllipse(ctx, 0, -30 * k, 22 * k, 24 * k);
      ctx.fill();
    }
    ctx.fillStyle = flash ? "#FFFFFF" : body;
    const headY = e.type === "sprinter" ? -52 * k : -56 * k;
    const headR = e.type === "sprinter" ? 13 * k : 16 * k;
    ctx.beginPath();
    ctx.arc(0, headY, headR, 0, Math.PI * 2);
    ctx.fill();
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
  function drawSoldier(ctx, sx, sy, scale, bob, flash, weapon) {
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
  function drawGun(ctx, x, y, k, weapon, color) {
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
  function drawSmgIcon(ctx, x, y, k, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x - 16 * k, y - 4 * k, 32 * k, 8 * k);
    ctx.fillRect(x - 8 * k, y + 4 * k, 7 * k, 10 * k);
    ctx.fillRect(x + 6 * k, y - 9 * k, 5 * k, 6 * k);
  }
  function drawSquad(ctx, squad, camX) {
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
  function drawBullet(ctx, b, camX) {
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
  function drawParticle(ctx, p, camX) {
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
  function drawHud(ctx, hud) {
    ctx.fillStyle = "rgba(20,24,32,0.45)";
    roundRect(ctx, 24, 24, CANVAS_W - 48, 84, 18);
    ctx.fill();
    ctx.fillStyle = "rgba(40,90,180,0.9)";
    roundRect(ctx, 40, 40, 150, 52, 14);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = 'bold 28px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("\u4EBA\u6570 " + hud.count, 56, 67);
    ctx.fillStyle = hud.weapon === "smg" ? "rgba(212,137,18,0.95)" : "rgba(70,80,96,0.95)";
    roundRect(ctx, 210, 40, 200, 52, 14);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = 'bold 22px "PingFang SC","Microsoft YaHei",sans-serif';
    const wname = WEAPONS[hud.weapon].name;
    const extra = hud.weapon === "smg" ? " " + Math.ceil(Math.max(0, hud.weaponTime)) + "s" : "";
    ctx.fillText(wname + extra, 226, 67);
    ctx.fillStyle = "rgba(20,24,32,0.8)";
    roundRect(ctx, CANVAS_W - 210, 40, 170, 52, 14);
    ctx.fill();
    ctx.fillStyle = hud.remain <= 10 && !hud.clearing ? "#FFE08A" : "#FFFFFF";
    ctx.font = 'bold 28px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(hud.clearing ? "\u6E05\u573A" : formatTime(hud.remain), CANVAS_W - 125, 67);
    if (hud.fireBonus > 0) {
      ctx.fillStyle = "rgba(56,140,255,0.92)";
      roundRect(ctx, 40, 118, 200, 36, 12);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = 'bold 18px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = "left";
      ctx.fillText("\u5C04\u901F\u63D0\u5347 " + hud.fireBonus.toFixed(1) + "s", 54, 137);
    }
    drawMute(ctx, hud.muted);
    if (hud.hint) {
      ctx.fillStyle = "rgba(16,20,28,0.72)";
      roundRect(ctx, 70, CANVAS_H - 210, CANVAS_W - 140, 72, 18);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = 'bold 22px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("\u5DE6\u53F3\u6ED1\u52A8 \xB7 \u81EA\u52A8\u5F00\u706B \xB7 \u7A7F\u84DD\u95E8\u52A0\u4EBA", CANVAS_W / 2, CANVAS_H - 172);
    }
  }
  function hitMute(x, y) {
    const dx = x - (CANVAS_W - 56);
    const dy = y - 150;
    return dx * dx + dy * dy <= 26 * 26;
  }
  function drawMute(ctx, muted) {
    ctx.fillStyle = "rgba(20,24,32,0.55)";
    ctx.beginPath();
    ctx.arc(CANVAS_W - 56, 150, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = '18px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(muted ? "\u9759\u97F3" : "\u97F3\u6548", CANVAS_W - 56, 151);
  }
  function drawTitle(ctx, best, muted = false) {
    dim(ctx);
    drawMute(ctx, muted);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.font = 'bold 64px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText("\u8DEF\u53E3\u706B\u529B", CANVAS_W / 2, 360);
    ctx.font = '24px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("\u81EA\u52A8\u5F00\u706B \xB7 \u7A7F\u95E8\u96C6\u7ED3", CANVAS_W / 2, 420);
    drawButton(ctx, CANVAS_W / 2 - 140, 560, 280, 80, "#3D8CDB", "\u5F00\u59CB\u6E38\u620F");
    ctx.fillStyle = "rgba(255,255,255,0.8)";
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
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText("\u9690\u79C1\u653F\u7B56  |  \u9002\u9F84\u63D0\u793A", CANVAS_W / 2, CANVAS_H - 80);
  }
  function titleHit(x, y) {
    if (x >= CANVAS_W / 2 - 140 && x <= CANVAS_W / 2 + 140 && y >= 560 && y <= 640) return "start";
    if (y >= CANVAS_H - 110 && y <= CANVAS_H - 50) return "legal";
    return null;
  }
  function drawLegal(ctx) {
    dim(ctx);
    ctx.fillStyle = "rgba(24,28,36,0.96)";
    roundRect(ctx, 70, 280, CANVAS_W - 140, 640, 22);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.font = 'bold 30px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText("\u9690\u79C1\u653F\u7B56\u4E0E\u9002\u9F84\u63D0\u793A", CANVAS_W / 2, 350);
    ctx.font = '20px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillStyle = "rgba(255,255,255,0.85)";
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
    drawButton(ctx, CANVAS_W / 2 - 110, 800, 220, 64, "#3D8CDB", "\u8FD4\u56DE");
  }
  function legalHit(x, y) {
    return x >= CANVAS_W / 2 - 110 && x <= CANVAS_W / 2 + 110 && y >= 800 && y <= 864;
  }
  function drawResult(ctx, win, kills, time, peak, best) {
    dim(ctx);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.font = 'bold 52px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText(win ? "\u6210\u529F\u901A\u5173\uFF01" : "\u961F\u4F0D\u5DF2\u89E3\u6563", CANVAS_W / 2, 340);
    ctx.font = '24px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.fillText(win ? "\u575A\u6301\u5230\u4E86\u7EC8\u70B9\u5E76\u6E05\u7A7A\u4E86\u6536\u675F\u6CE2" : "\u4EBA\u6570\u5F52\u96F6\uFF0C\u518D\u6574\u961F\u51FA\u53D1\u5427", CANVAS_W / 2, 400);
    const rows = [
      ["\u51FB\u6740", String(kills)],
      ["\u575A\u6301\u65F6\u95F4", formatTime(time)],
      ["\u672C\u5C40\u6700\u9AD8\u4EBA\u6570", String(peak)],
      ["\u5386\u53F2\u6700\u9AD8\u51FB\u6740", String(best.kills)],
      ["\u5386\u53F2\u6700\u9AD8\u4EBA\u6570", String(best.peakCount)]
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
    drawButton(ctx, CANVAS_W / 2 - 140, 740, 280, 80, "#3D8CDB", "\u518D\u6765\u4E00\u5C40");
  }
  function resultHit(x, y) {
    return x >= CANVAS_W / 2 - 140 && x <= CANVAS_W / 2 + 140 && y >= 740 && y <= 820;
  }
  function drawButton(ctx, x, y, w, h, color, label) {
    ctx.fillStyle = color;
    roundRect(ctx, x, y, w, h, 18);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = 'bold 32px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + w / 2, y + h / 2 + 2);
  }
  function dim(ctx) {
    ctx.fillStyle = "rgba(10,14,22,0.55)";
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
      this.firePhase = 0;
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
      this.firePhase = 0;
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
    /** 返回本帧应发射的伤害（可能为 0）以及用于散布的相位 */
    tryFire(dt) {
      if (this.count <= 0) return null;
      const def = this.weaponDef;
      const desired = def.rate * this.count * this.fireMul;
      const visual = Math.min(desired, VISUAL_FIRE_CAP);
      const dmg = def.damage * (desired / visual);
      this.fireCd -= dt;
      if (this.fireCd > 0) return null;
      this.fireCd += 1 / Math.max(visual, 0.01);
      this.firePhase = (this.firePhase + 1) % Math.max(1, this.count);
      const slot = this.slotOf(this.firePhase % this.count);
      return { damage: dmg, x: this.x + slot.x * 0.35, phase: this.firePhase };
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
      this.clearing = false;
      this.finalWaveSpawned = false;
      this.shake = 0;
      this.squad = new Squad();
      this.enemies = new Enemies();
      this.bullets = new Bullets();
      this.gates = new Gates();
      this.particles = new Particles();
      this.cursor = 0;
      this.pendingPairs = /* @__PURE__ */ new Map();
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
        remain: this.clearing ? 0 : Math.max(0, RUN_DURATION - this.time),
        finalWaveSpawned: this.finalWaveSpawned,
        clearing: this.clearing
      };
    }
    beginRun() {
      this.state = "playing";
      this.time = 0;
      this.kills = 0;
      this.hint = true;
      this.hintTimer = 0;
      this.clearing = false;
      this.finalWaveSpawned = false;
      this.shake = 0;
      this.cursor = 0;
      this.pendingPairs.clear();
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
      this.gates.update(dt);
      this.enemies.update(dt);
      this.shoot(dt);
      this.bullets.update(dt);
      this.collideBullets();
      this.collideGates();
      this.collideEnemies();
      this.particles.update(dt);
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
      if (this.time >= FINAL_WAVE_LAST_SPAWN + 0.05) this.finalWaveSpawned = true;
      if (this.time >= RUN_DURATION) this.clearing = true;
      if (this.squad.count <= 0) {
        this.endRun(false);
        return;
      }
      if (this.clearing && this.finalWaveSpawned && this.enemies.pool.size === 0) {
        this.endRun(true);
      }
    }
    spawnDue() {
      while (this.cursor < TIMELINE.length && TIMELINE[this.cursor].time <= this.time) {
        const ev = TIMELINE[this.cursor++];
        this.applyEvent(ev);
        this.spawned.push(ev);
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
    fireLaneX() {
      if (this.squad.x >= 0.45) return LANE_X;
      if (this.squad.x <= -0.45) return -LANE_X;
      return this.squad.x;
    }
    shoot(dt) {
      const shot = this.squad.tryFire(dt);
      if (!shot) return;
      const b = this.bullets.spawn(this.fireLaneX(), this.squad.z, shot.damage);
      if (b) this.audio.play("shoot");
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
            const color = e.type === "sprinter" ? "#E8A23A" : "#7B8EE8";
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
            this.particles.puff(e.x, 0.4, e.z, e.type === "sprinter" ? "#E8A23A" : "#7B8EE8");
            this.enemies.pool.release(e);
            continue;
          }
          this.squad.lose(1);
          this.shake = 0.28;
          this.particles.puff(e.x, 0.4, e.z, e.type === "sprinter" ? "#E8A23A" : "#7B8EE8");
          this.audio.play("red");
          this.enemies.pool.release(e);
          if (this.squad.count <= 0) return;
        }
      }
    }
    endRun(win) {
      this.state = win ? "win" : "fail";
      this.best = saveBest(
        this.platform,
        { kills: this.kills, peakCount: this.squad.peak, time: this.time },
        this.best
      );
      this.audio.play(win ? "win" : "fail");
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
          remain: this.clearing ? 0 : Math.max(0, RUN_DURATION - this.time),
          fireBonus: this.squad.fireBonus,
          muted: this.audio.muted,
          hint: this.hint,
          clearing: this.clearing
        });
      } else if (this.state === "title") {
        drawTitle(ctx, this.best, this.audio.muted);
      } else if (this.state === "legal") {
        drawLegal(ctx);
      } else {
        drawResult(ctx, this.state === "win", this.kills, this.time, this.squad.peak, this.best);
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
