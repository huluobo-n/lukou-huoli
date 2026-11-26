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
  var MAX_PROPS = 8;
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
    },
    heavy: {
      id: "heavy",
      name: "\u91CD\u51FB",
      damage: 3.4,
      rate: 2.4,
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
    },
    shield: {
      id: "shield",
      name: "\u76FE\u5175",
      speed: 0.72,
      hp: 6,
      radius: 0.9,
      scale: 1.18,
      contactLoss: 1,
      damageTakenMul: 0.5
    },
    bomber: {
      id: "bomber",
      name: "\u7206\u88C2\u4F53",
      speed: 0.88,
      hp: 4,
      radius: 0.8,
      scale: 1.06,
      contactLoss: 3
    },
    splitter: {
      id: "splitter",
      name: "\u5206\u88C2\u4F53",
      speed: 0.95,
      hp: 4,
      radius: 0.78,
      scale: 1.08,
      contactLoss: 1
    },
    splitling: {
      id: "splitling",
      name: "\u5206\u88C2\u4F53",
      speed: 1.15,
      hp: 2,
      radius: 0.48,
      scale: 0.68,
      contactLoss: 1
    },
    jumper: {
      id: "jumper",
      name: "\u8DF3\u8DC3\u4F53",
      speed: 1.12,
      hp: 3,
      radius: 0.58,
      scale: 0.9,
      contactLoss: 1,
      jumpEvery: 2.1,
      jumpDuration: 0.58,
      jumpHeight: 2.4
    }
  };
  var HIT_IFRAMES = 0.85;
  var OVERFLOW_BONUS_DURATION = 3;
  var OVERFLOW_BONUS_MUL = 1.6;
  var STORAGE_KEY = "lukou-huoli-best";
  var GATE_CHARGE_CAP = 15;
  var GOLD_GATE_AT = 12;
  var GOLD_GATE_Z = 36;
  var GOLD_AMP_MUL = 2;
  var GOLD_NEAR_MUL = 0.5;
  var HP_SCALE_START = 10;
  var HP_SCALE_PER_SEC = 0.02;
  var HP_SCALE_LATE_START = 60;
  var HP_SCALE_LATE_PER_SEC = 0.012;
  function enemyHpMul(t) {
    if (t <= HP_SCALE_START) return 1;
    let mul = 1 + (t - HP_SCALE_START) * HP_SCALE_PER_SEC;
    if (t > HP_SCALE_LATE_START) mul += (t - HP_SCALE_LATE_START) * HP_SCALE_LATE_PER_SEC;
    return mul;
  }
  var WARNING_FIRST = 28;
  var WARNING_TELEGRAPH = 1.2;
  var WARNING_DAMAGE = 7;
  function warningPeriod(t) {
    return Math.max(7, 13 - Math.max(0, t - WARNING_FIRST) * 0.07);
  }
  var RUSH_FIRST = 36;
  var RUSH_TELEGRAPH = 1.2;
  var RUSH_SPAWN_Z = 42;
  var RUSH_BANNER = 2.4;
  function rushPeriod(t) {
    return Math.max(10, 16.5 - Math.max(0, t - RUSH_FIRST) * 0.05);
  }
  function rushPack(t) {
    if (t >= 80) return ["bomber", "jumper", "sprinter"];
    if (t >= 60) return ["jumper", "walker", "sprinter"];
    return ["walker", "walker", "sprinter"];
  }
  var OVERFLOW_SHIELD_DURATION = 5.5;
  var SHIELD_DAMAGE_MUL = 0.5;
  var SHIELD_GATE_DURATION = 6;
  var CAP_EXPIRE_SHIELD = 5;
  var NIGHT_SHIELD_DURATION = 6;
  var NIGHT_WEAPON_MIN = 6;
  var SCENE_SHIFT_AT = 60;
  var SCENE_BANNER = 2.8;
  var GOLD_GATE_LIFE = 16;
  var GOLD_WINDOW_LIFE = 10;
  var GOLD_WINDOW_LULL = 4.8;
  var GOLD_WINDOW_SAFE = 6.5;
  var GOLD_WINDOW_Z = 32;
  var GOLD_WINDOW_BASE = [58, 94, 132];
  var GOLD_CLOSE_BANNER = 1.6;
  var RUSH_QUIET = 5.2;
  var PINCER_FIRST = 52;
  var PINCER_TELEGRAPH = 1.25;
  var PINCER_BANNER = 2.6;
  var PINCER_PERIOD = 28;
  var ALLEY_FIRST = 78;
  var ALLEY_TELEGRAPH = 1.3;
  var ALLEY_BANNER = 2.6;
  var ALLEY_PERIOD = 30;
  var ALLEY_SPAWN_Z = 40;
  var ALLEY_SIDE_X = 8;
  var HOLD_FIRST = 150;
  var HOLD_TELEGRAPH = 1.6;
  var HOLD_DURATION = 5.2;
  var HOLD_DAMAGE = 8;
  var HOLD_MID = 1.15;
  var ENDLESS_GATE_PERIOD_LATE = 14;
  var MERCY_AT = 10.2;
  var MERCY_MAX_COUNT = 2;
  var MERCY_Z = 22;
  function seedOffset(seed, key, span) {
    const x = Math.imul(seed ^ key * 2654435769, 2246822507) >>> 0;
    return (x / 4294967295 - 0.5) * 2 * span;
  }
  function goldWindowTime(index, seed) {
    var _a;
    const base = (_a = GOLD_WINDOW_BASE[index]) != null ? _a : GOLD_WINDOW_BASE[GOLD_WINDOW_BASE.length - 1] + (index - GOLD_WINDOW_BASE.length + 1) * 34;
    const span = index === 0 ? 2 : 4;
    return base + seedOffset(seed, 17 + index, span);
  }
  function pincerTime(index, seed) {
    const span = index === 0 ? 2 : 4.5;
    return PINCER_FIRST + index * PINCER_PERIOD + seedOffset(seed, 31 + index, span);
  }
  function alleyTime(index, seed) {
    return ALLEY_FIRST + index * ALLEY_PERIOD + seedOffset(seed, 53 + index, 5.5);
  }
  function holdTime(seed) {
    return HOLD_FIRST + seedOffset(seed, 71, 8);
  }
  function alleySide(index, seed) {
    const x = Math.imul(seed ^ (91 + index) * 2654435769, 2246822507) >>> 0;
    const r = x % 3;
    return r === 0 ? "left" : r === 1 ? "right" : "both";
  }
  function alleyBannerText(side) {
    if (side === "left") return "\u5DF7\u53E3\u6765\u88AD\uFF01\u5DE6\u4FA7\u63D2\u8FDB\uFF01";
    if (side === "right") return "\u5DF7\u53E3\u6765\u88AD\uFF01\u53F3\u4FA7\u63D2\u8FDB\uFF01";
    return "\u5DF7\u53E3\u6765\u88AD\uFF01\u5DE6\u53F3\u63D2\u8FDB\uFF01";
  }
  function softenGate(ev, time, count, peak) {
    var _a;
    if (time < SCENE_SHIFT_AT) return ev;
    if (ev.kind !== "gate") return ev;
    if (ev.gate !== "add" && ev.gate !== "mul") return ev;
    if (peak >= MAX_SQUAD && count >= MAX_SQUAD) {
      return { ...ev, gate: "shield", value: void 0, weapon: void 0, label: "\u62A4\u76FE" };
    }
    if (peak >= MAX_SQUAD) {
      return { ...ev, gate: "add", value: 1, weapon: void 0, label: "+1" };
    }
    if (ev.gate === "mul") return { ...ev, gate: "add", value: 2, weapon: void 0, label: "+2" };
    const v = Math.max(1, Math.floor(((_a = ev.value) != null ? _a : 3) / 2));
    return { ...ev, value: v, label: "+" + v };
  }
  function cageRewardAt(time, peak) {
    if (time >= SCENE_SHIFT_AT && peak >= MAX_SQUAD) return 1;
    return CAGE_REWARD;
  }
  var CAGE_HP = 8;
  var CAGE_REWARD = 3;
  var CAGE_LABEL = "\u6551\u51FA";
  var BARREL_HP = 3;
  var BARREL_AOE_RADIUS = 3.4;
  var BARREL_AOE_DAMAGE = 8;
  var BARREL_CONTACT_LOSS = 2;
  var GATE_EVENTS = [
    // —— 0–10 秒教学 ——
    { time: 6, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
    { time: 7.25, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "\u51B2\u950B\u67AA" },
    // —— 10–40 秒：左道 +N / ×2 / 武器门 ——
    { time: 11.5, kind: "gate", lane: "left", gate: "add", value: 2, label: "+2" },
    { time: 16, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "\u51B2\u950B\u67AA" },
    { time: 22, kind: "gate", lane: "left", gate: "mul", value: 2, label: "\xD72" },
    { time: 27, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
    { time: 32.8, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
    { time: 36.5, kind: "gate", lane: "left", gate: "add", value: 5, label: "+5" },
    // —— 40–70 秒：约 40 秒后出现成对红门 -3 / 蓝门 +3 ——
    { time: 40.5, kind: "gate", lane: "right", gate: "red", value: 3, label: "-3" },
    { time: 40.5, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
    { time: 48.5, kind: "gate", lane: "left", gate: "weapon", weapon: "heavy", label: "\u91CD\u51FB" },
    { time: 51, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
    { time: 58, kind: "gate", lane: "left", gate: "red", value: 3, label: "-3" },
    { time: 62.5, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
    { time: 67, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "\u51B2\u950B\u67AA" }
  ];
  var RIGHT_LANE_GAPS = [[39.85, 41.15]];
  function inRightLaneGap(time) {
    return RIGHT_LANE_GAPS.some(([a, b]) => time >= a && time <= b);
  }
  function laneCenterX(lane) {
    if (lane === "mid") return 0;
    return lane === "left" ? -LANE_X : LANE_X;
  }
  function inLane(x, lane) {
    return Math.abs(x - laneCenterX(lane)) <= LANE_HALF;
  }
  function laneOfX(x) {
    return x < 0 ? "left" : "right";
  }
  function addEnemy(events, time, enemy) {
    const t = Math.round(time * 100) / 100;
    if (inRightLaneGap(t)) return;
    events.push({ time: t, kind: "enemy", lane: "right", enemy });
  }
  function buildHorde() {
    const events = [];
    for (let t = 2; t <= 6; t += 1) addEnemy(events, t, "walker");
    for (let t = 7.2; t < 20; t += 0.5) addEnemy(events, t, "walker");
    for (let t = 20; t < 40; t += 0.32) {
      addEnemy(events, t, "walker");
      if (t >= 28) addEnemy(events, t + 0.1, "sprinter");
    }
    for (let t = 40; t < 70; t += 0.34) {
      addEnemy(events, t, "walker");
      addEnemy(events, t + 0.1, "sprinter");
    }
    for (let t = 70; t <= 87; t += 0.26) {
      addEnemy(events, t, "walker");
      addEnemy(events, t + 0.08, "sprinter");
    }
    for (let t = 16; t <= 87; t += 2.2) addEnemy(events, t, "jumper");
    for (let t = 28; t <= 87; t += 2.8) addEnemy(events, t, "shield");
    for (let t = 38; t <= 87; t += 3.4) addEnemy(events, t, "bomber");
    for (let t = 50; t <= 87; t += 2.8) addEnemy(events, t, "splitter");
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
  var ENDLESS_GATE_PERIOD = 10;
  var ENDLESS_GATE_CYCLE = [
    { time: 0, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
    { time: 0, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "\u51B2\u950B\u67AA" },
    { time: 0, kind: "gate", lane: "left", gate: "shield", label: "\u62A4\u76FE" },
    { time: 0, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
    { time: 0, kind: "gate", lane: "left", gate: "weapon", weapon: "heavy", label: "\u91CD\u51FB" },
    { time: 0, kind: "gate", lane: "left", gate: "add", value: 5, label: "+5" }
  ];
  function endlessGateFor(index, seed) {
    const i = (index + (seed >>> 0) % ENDLESS_GATE_CYCLE.length) % ENDLESS_GATE_CYCLE.length;
    return ENDLESS_GATE_CYCLE[i];
  }
  function endlessHordeInterval(t) {
    return Math.max(0.14, 0.24 - Math.max(0, t - 70) * 2e-3);
  }
  var ENDLESS_MIX = [
    "walker",
    "sprinter",
    "jumper",
    "shield",
    "sprinter",
    "bomber",
    "splitter",
    "jumper",
    "walker",
    "sprinter",
    "shield",
    "bomber"
  ];
  var PROP_EVENTS = [
    { time: 18.5, kind: "cage", lane: "left" },
    { time: 24.5, kind: "barrel", lane: "right" },
    { time: 30.2, kind: "cage", lane: "left" },
    { time: 45.5, kind: "barrel", lane: "right" },
    { time: 53.5, kind: "cage", lane: "left" },
    { time: 60.8, kind: "barrel", lane: "right" }
  ];
  var ENDLESS_PROP_START = 76;
  var ENDLESS_PROP_PERIOD = 18;
  function formatGateLabel(kind, signed) {
    if (kind === "red" || signed < 0) return String(signed);
    if (signed === 0) return "0";
    return "+" + signed;
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
    b.amplified = false;
    b.heavy = false;
  }
  var Bullets = class {
    constructor() {
      this.pool = new Pool(MAX_BULLETS, () => ({
        alive: false,
        x: 0,
        y: 0.8,
        z: TEAM_Z,
        pz: TEAM_Z,
        damage: 1,
        amplified: false,
        heavy: false
      }), resetB);
    }
    clear() {
      this.pool.clear();
    }
    spawn(x, z, damage, opts) {
      const b = this.pool.acquire();
      if (!b) return null;
      b.alive = true;
      b.x = x;
      b.y = 0.85;
      b.z = z + 0.8;
      b.pz = b.z;
      b.damage = damage;
      b.amplified = false;
      b.heavy = !!(opts == null ? void 0 : opts.heavy);
      return b;
    }
    update(dt) {
      const list = this.pool.active;
      for (let i = list.length - 1; i >= 0; i--) {
        const b = list[i];
        b.pz = b.z;
        b.z += BULLET_SPEED * dt;
        if (b.z >= BULLET_RANGE_Z || !b.alive) this.pool.releaseAt(i);
      }
    }
  };

  // src/enemies.ts
  function resetE(e) {
    e.alive = false;
    e.hp = 0;
    e.airborne = false;
    e.isChild = false;
    e.y = 0;
    e.driftX = null;
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
        hitFlash: 0,
        airborne: false,
        jumpT: 0,
        airT: 0,
        isChild: false,
        driftX: null
      }), resetE);
    }
    clear() {
      this.pool.clear();
    }
    spawn(type, lane, opts) {
      var _a, _b, _c, _d;
      const e = this.pool.acquire();
      if (!e) return null;
      const def = ENEMY[type];
      const mul = Math.max(0.01, (_a = opts == null ? void 0 : opts.hpMul) != null ? _a : 1);
      e.alive = true;
      e.type = type;
      const slot = this.pool.size % 3;
      const base = lane === "left" ? -LANE_X : lane === "mid" ? 0 : LANE_X;
      e.x = (_b = opts == null ? void 0 : opts.x) != null ? _b : base + (slot - 1) * 0.62;
      e.y = 0;
      e.z = (_c = opts == null ? void 0 : opts.z) != null ? _c : SPAWN_Z;
      e.hp = def.hp * mul;
      e.maxHp = def.hp * mul;
      e.radius = def.radius;
      e.age = 0;
      e.dashT = type === "sprinter" ? 0.8 : 0;
      e.dashing = 0;
      e.walk = 0;
      e.hitFlash = 0;
      e.airborne = false;
      e.airT = 0;
      e.jumpT = type === "jumper" ? 0.35 + slot * 0.4 : 0;
      e.isChild = !!(opts == null ? void 0 : opts.isChild);
      e.driftX = (_d = opts == null ? void 0 : opts.driftX) != null ? _d : null;
      return e;
    }
    update(dt, rightMul = 1) {
      const list = this.pool.active;
      for (let i = list.length - 1; i >= 0; i--) {
        const e = list[i];
        const def = ENEMY[e.type];
        e.age += dt;
        e.walk += dt * def.speed * 6;
        if (e.driftX != null) {
          const k = 1 - Math.exp(-1.15 * dt);
          e.x += (e.driftX - e.x) * k;
        }
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
        if (e.type === "jumper") {
          this.updateJumper(e, dt);
        }
        const laneMul = e.x > 0.15 ? rightMul : 1;
        e.z -= BASE_SPEED * def.speed * mul * laneMul * dt;
        if (e.z < DESPAWN_Z || !e.alive) this.pool.releaseAt(i);
      }
    }
    updateJumper(e, dt) {
      const every = ENEMY.jumper.jumpEvery;
      const dur = ENEMY.jumper.jumpDuration;
      const height = ENEMY.jumper.jumpHeight;
      if (e.airborne) {
        e.airT -= dt;
        const t = 1 - Math.max(0, e.airT) / dur;
        e.y = 4 * height * t * (1 - t);
        if (e.airT <= 0) {
          e.airborne = false;
          e.y = 0;
          e.jumpT = every;
        }
      } else {
        e.y = 0;
        e.jumpT -= dt;
        if (e.jumpT <= 0) {
          e.airborne = true;
          e.airT = dur;
        }
      }
    }
    /** 造成伤害。盾兵承伤减半。生命降至 0 返回 true。 */
    hurt(e, dmg, opts) {
      var _a;
      const takenMul = (opts == null ? void 0 : opts.pierce) ? 1 : "damageTakenMul" in ENEMY[e.type] ? (_a = ENEMY[e.type].damageTakenMul) != null ? _a : 1 : 1;
      e.hp -= dmg * takenMul;
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
    g.stationary = false;
  }
  function gateSignedValue(g) {
    if (g.kind === "red") return -g.value;
    return g.value;
  }
  function chargeGate(g, cap = GATE_CHARGE_CAP) {
    if (g.kind !== "add" && g.kind !== "red") return false;
    const current = gateSignedValue(g);
    if (current >= cap) return false;
    const signed = current + 1;
    if (signed >= 0) {
      g.kind = "add";
      g.value = signed;
      g.label = formatGateLabel("add", signed);
    } else {
      g.kind = "red";
      g.value = -signed;
      g.label = formatGateLabel("red", signed);
    }
    return true;
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
        pairKey: 0,
        stationary: false
      }), resetG);
      this.pairSeq = 1;
    }
    clear() {
      this.pool.clear();
      this.pairSeq = 1;
    }
    /** 同一时刻两道的门使用相同 pairKey，走过一道则另一道消失 */
    spawn(opts) {
      var _a, _b, _c, _d;
      const g = this.pool.acquire();
      if (!g) return null;
      g.alive = true;
      g.kind = opts.kind;
      g.lane = opts.lane;
      g.x = opts.lane === "left" ? -LANE_X : LANE_X;
      g.z = (_a = opts.z) != null ? _a : SPAWN_Z;
      g.value = (_b = opts.value) != null ? _b : 0;
      g.weapon = (_c = opts.weapon) != null ? _c : null;
      g.label = opts.label;
      g.consumed = false;
      g.pairKey = (_d = opts.pairKey) != null ? _d : 0;
      g.stationary = !!opts.stationary;
      return g;
    }
    nextPairKey() {
      return this.pairSeq++;
    }
    update(dt) {
      const list = this.pool.active;
      for (let i = list.length - 1; i >= 0; i--) {
        const g = list[i];
        if (!g.stationary) g.z -= BASE_SPEED * dt;
        if (!g.stationary && g.z < DESPAWN_Z || !g.alive) this.pool.releaseAt(i);
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
    ampGates() {
      return this.pool.active.filter((g) => g.kind === "amp" && g.alive);
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
      this.lastY = 0;
      this.scrollAcc = 0;
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
      this.lastY = 0;
      this.scrollAcc = 0;
      this.keys.clear();
      this.clicks.length = 0;
    }
    consumeClicks() {
      const list = this.clicks.slice();
      this.clicks.length = 0;
      return list;
    }
    consumeScroll(dt = 0) {
      let d = this.scrollAcc;
      this.scrollAcc = 0;
      if (this.keys.has("ArrowUp")) d += 420 * dt;
      if (this.keys.has("ArrowDown")) d -= 420 * dt;
      if (this.keys.has("PageUp")) d += 720 * dt;
      if (this.keys.has("PageDown")) d -= 720 * dt;
      return d;
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
      this.lastY = p.y;
      const logic = this.platform.toLogic(p.x, p.y);
      this.clicks.push(logic);
    }
    move(p) {
      if (!this.dragging || this.pointerId !== null && p.id !== this.pointerId) return;
      const dx = p.x - this.lastX;
      const dy = p.y - this.lastY;
      this.lastX = p.x;
      this.lastY = p.y;
      if (Math.abs(dx) > 0.4 || Math.abs(dy) > 0.4) this.swiped = true;
      const logicDx = dx / this.platform.cssWidth * CANVAS_W;
      const logicDy = this.platform.cssHeight > 0 ? dy / this.platform.cssHeight * CANVAS_H : dy;
      this.scrollAcc += logicDy;
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
    burst(x, y, z, color) {
      for (let i = 0; i < 16; i++) {
        const p = this.pool.acquire();
        if (!p) return;
        p.alive = true;
        p.kind = i % 3 === 0 ? "spark" : "puff";
        p.x = x + (i % 5 - 2) * 0.16;
        p.y = y + 0.5;
        p.z = z;
        const a = i / 16 * Math.PI * 2;
        p.vx = Math.cos(a) * (2.8 + i % 4 * 0.7);
        p.vy = 2.2 + i % 3 * 0.9;
        p.vz = Math.sin(a) * 2.2;
        p.maxLife = p.life = 0.32;
        p.size = i % 2 === 0 ? 12 : 8;
        p.color = i % 2 === 0 ? "#FFE27A" : color;
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

  // src/props.ts
  function resetP2(p) {
    p.alive = false;
    p.opened = false;
  }
  var Props = class {
    constructor() {
      this.pool = new Pool(MAX_PROPS, () => ({
        alive: false,
        kind: "barrel",
        lane: "right",
        x: 0,
        z: SPAWN_Z,
        hp: 3,
        maxHp: 3,
        radius: 0.9,
        opened: false
      }), resetP2);
    }
    clear() {
      this.pool.clear();
    }
    spawn(kind, lane, opts) {
      var _a, _b;
      const p = this.pool.acquire();
      if (!p) return null;
      p.alive = true;
      p.kind = kind;
      p.lane = lane;
      p.x = laneCenterX(lane);
      p.z = (_a = opts == null ? void 0 : opts.z) != null ? _a : SPAWN_Z;
      p.maxHp = (_b = opts == null ? void 0 : opts.hp) != null ? _b : kind === "cage" ? CAGE_HP : BARREL_HP;
      p.hp = p.maxHp;
      p.radius = kind === "cage" ? 1.15 : 0.95;
      p.opened = false;
      return p;
    }
    update(dt) {
      const list = this.pool.active;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.z -= BASE_SPEED * dt;
        if (p.z < DESPAWN_Z || !p.alive) this.pool.releaseAt(i);
      }
    }
    hurt(p, dmg) {
      p.hp -= dmg;
      if (p.hp <= 0) {
        p.hp = 0;
        p.opened = true;
        p.alive = false;
        return true;
      }
      return false;
    }
  };

  // src/legal.ts
  var LEGAL_SUMMARY_TITLE = "\u9690\u79C1\u4E0E\u9002\u9F84";
  var LEGAL_SUMMARY = [
    "\u300A\u8DEF\u53E3\u706B\u529B\u300B\u662F\u4E00\u6B3E\u5361\u901A\u98CE\u683C\u7684\u4F11\u95F2\u5C04\u51FB\u5C0F\u6E38\u620F\uFF0C\u5EFA\u8BAE 12 \u5468\u5C81\u53CA\u4EE5\u4E0A\u73A9\u5BB6\u4F7F\u7528\u3002\u8BF7\u5408\u7406\u5B89\u6392\u6E38\u620F\u65F6\u95F4\uFF1B\u672A\u6EE1 18 \u5468\u5C81\u7684\u73A9\u5BB6\uFF0C\u5EFA\u8BAE\u5728\u76D1\u62A4\u4EBA\u6307\u5BFC\u4E0B\u4F7F\u7528\u3002",
    "\u672C\u6E38\u620F\u4E0D\u8981\u6C42\u6CE8\u518C\u6216\u767B\u5F55\uFF0C\u4E5F\u4E0D\u6536\u96C6\u59D3\u540D\u3001\u624B\u673A\u53F7\u3001\u8EAB\u4EFD\u8BC1\u7B49\u4E2A\u4EBA\u8EAB\u4EFD\u4FE1\u606F\u3002\u672C\u5C40\u51FB\u6740\u3001\u575A\u6301\u65F6\u95F4\u548C\u6700\u9AD8\u4EBA\u6570\uFF0C\u4EE5\u53CA\u97F3\u6548\u5F00\u5173\uFF0C\u53EA\u4FDD\u5B58\u5728\u4F60\u6B63\u5728\u4F7F\u7528\u7684\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u7528\u4E8E\u663E\u793A\u672C\u5730\u6700\u597D\u6210\u7EE9\uFF0C\u4E0D\u4F1A\u4E0A\u4F20\u5230\u5F00\u53D1\u8005\u7684\u670D\u52A1\u5668\u3002",
    "\u672C\u7248\u672C\u6CA1\u6709\u5185\u8D2D\uFF0C\u5E7F\u544A\u80FD\u529B\u5DF2\u5173\u95ED\u3002\u82E5\u4EE5\u540E\u5F00\u901A\u5E7F\u544A\u6216\u5176\u4ED6\u670D\u52A1\uFF0C\u4F1A\u5728\u672C\u8BF4\u660E\u4E2D\u66F4\u65B0\u3002",
    "\u5B8C\u6574\u8BF4\u660E\u8BF7\u89C1\u300A\u9690\u79C1\u653F\u7B56\u300B\u548C\u300A\u9002\u9F84\u63D0\u793A\u300B\u3002\u6709\u95EE\u9898\u53EF\u53D1\u4FE1\u81F3 pengnanhu81@gmail.com\u3002"
  ];
  var LEGAL_PRIVACY_TITLE = "\u9690\u79C1\u653F\u7B56";
  var LEGAL_PRIVACY = [
    "\u751F\u6548\u65E5\u671F\uFF1A2026 \u5E74 11 \u6708 26 \u65E5",
    "\u672C\u653F\u7B56\u9002\u7528\u4E8E\u300A\u8DEF\u53E3\u706B\u529B\u300B\u7F51\u9875\u7248\uFF08\u5F53\u524D\u5730\u5740\uFF1Ahttps://huluobo-n.github.io/lukou-huoli/ \uFF09\u3002\u672C\u6E38\u620F\u7531\u4E2A\u4EBA\u5F00\u53D1\u8005\u7EF4\u62A4\u3002\u5982\u4F60\u5BF9\u4E2A\u4EBA\u4FE1\u606F\u5904\u7406\u6709\u7591\u95EE\uFF0C\u53EF\u53D1\u4FE1\u81F3 pengnanhu81@gmail.com\u3002",
    "1. \u6211\u4EEC\u6536\u96C6\u54EA\u4E9B\u4FE1\u606F",
    "\u672C\u6E38\u620F\u4E0D\u8981\u6C42\u6CE8\u518C\u6216\u767B\u5F55\uFF0C\u4E0D\u6536\u96C6\u4F60\u7684\u59D3\u540D\u3001\u624B\u673A\u53F7\u3001\u7535\u5B50\u90AE\u7BB1\u3001\u8EAB\u4EFD\u8BC1\u53F7\u6216\u5176\u4ED6\u7528\u4E8E\u8BC6\u522B\u4E2A\u4EBA\u8EAB\u4EFD\u7684\u4FE1\u606F\uFF0C\u4E5F\u4E0D\u7533\u8BF7\u76F8\u673A\u3001\u9EA6\u514B\u98CE\u3001\u901A\u8BAF\u5F55\u6216\u4F4D\u7F6E\u6743\u9650\u3002",
    "\u4E3A\u4E86\u5728\u540C\u4E00\u53F0\u8BBE\u5907\u4E0A\u8BB0\u4F4F\u6700\u597D\u6210\u7EE9\u548C\u97F3\u6548\u504F\u597D\uFF0C\u672C\u6E38\u620F\u53EA\u4F1A\u5728\u672C\u5730\u4FDD\u5B58\u4EE5\u4E0B\u4FE1\u606F\uFF1A",
    "\u6700\u957F\u575A\u6301\u65F6\u95F4\u3001\u5386\u53F2\u6700\u9AD8\u51FB\u6740\u3001\u5386\u53F2\u6700\u9AD8\u4EBA\u6570\uFF1B",
    "\u97F3\u6548\u662F\u5426\u5173\u95ED\u3002",
    "\u8FD9\u4E9B\u4FE1\u606F\u5B58\u50A8\u5728\u4F60\u6B63\u5728\u4F7F\u7528\u7684\u6D4F\u89C8\u5668\uFF08\u6216\u65E5\u540E\u5982\u5728\u5FAE\u4FE1\u4E2D\u6253\u5F00\u65F6\u7684\u540C\u7C7B\u672C\u5730\u5B58\u50A8\uFF09\u4E2D\uFF0C\u4E0D\u4F1A\u4E0A\u4F20\u5230\u5F00\u53D1\u8005\u7684\u670D\u52A1\u5668\uFF0C\u4E5F\u4E0D\u4F1A\u7528\u4E8E\u7528\u6237\u753B\u50CF\u6216\u5411\u4F60\u53D1\u9001\u8425\u9500\u4FE1\u606F\u3002\u6E05\u9664\u7F51\u7AD9\u6570\u636E\u6216\u5378\u8F7D\u540E\uFF0C\u4E0A\u8FF0\u672C\u5730\u8BB0\u5F55\u53EF\u80FD\u4E00\u5E76\u6D88\u5931\uFF0C\u4E14\u65E0\u6CD5\u6062\u590D\u3002",
    "2. \u8BBF\u95EE\u7F51\u9875\u65F6\u7684\u901A\u5E38\u60C5\u51B5",
    "\u6253\u5F00\u672C\u6E38\u620F\u9875\u9762\u65F6\uFF0C\u63D0\u4F9B\u7F51\u9875\u6258\u7BA1\u548C\u4F20\u8F93\u7684\u670D\u52A1\uFF08\u5F53\u524D\u4E3A GitHub Pages \u53CA\u5185\u5BB9\u5206\u53D1\u7F51\u7EDC\uFF09\u53EF\u80FD\u4F1A\u8BB0\u5F55\u5E38\u89C4\u8BBF\u95EE\u65E5\u5FD7\uFF0C\u4F8B\u5982 IP \u5730\u5740\u3001\u8BBF\u95EE\u65F6\u95F4\u3001\u6D4F\u89C8\u5668\u7C7B\u578B\u7B49\u3002\u8FD9\u662F\u8BBF\u95EE\u516C\u5F00\u7F51\u9875\u65F6\u7684\u5E38\u89C1\u505A\u6CD5\u3002\u672C\u6E38\u620F\u4E0D\u4F9D\u636E\u8FD9\u4E9B\u65E5\u5FD7\u8BC6\u522B\u4F60\u7684\u8EAB\u4EFD\uFF0C\u5F00\u53D1\u8005\u4E5F\u4E0D\u4F1A\u53E6\u5916\u642D\u5EFA\u670D\u52A1\u5668\u6765\u6C47\u96C6\u8FD9\u4E9B\u65E5\u5FD7\u3002",
    "3. \u5185\u8D2D\u3001\u5E7F\u544A\u4E0E\u7B2C\u4E09\u65B9\u670D\u52A1",
    "\u672C\u7248\u672C\u4E0D\u542B\u5185\u8D2D\uFF0C\u4E5F\u4E0D\u63D0\u4F9B\u8D26\u53F7\u3001\u6392\u884C\u699C\u670D\u52A1\u5668\u6216\u793E\u4EA4\u529F\u80FD\u3002",
    "\u672C\u7248\u672C\u7684\u5E7F\u544A\u80FD\u529B\u5904\u4E8E\u5173\u95ED\u72B6\u6001\uFF0C\u4E0D\u4F1A\u5C55\u793A\u6FC0\u52B1\u5E7F\u544A\u6216\u63D2\u5C4F\u5E7F\u544A\uFF0C\u4E5F\u672A\u63A5\u5165\u7EDF\u8BA1\u5206\u6790\u6216\u5E7F\u544A SDK\u3002\u82E5\u65E5\u540E\u5F00\u542F\u5E7F\u544A\u3001\u63A5\u5165\u7B2C\u4E09\u65B9\u670D\u52A1\u6216\u589E\u52A0\u9700\u8981\u6536\u96C6\u4FE1\u606F\u7684\u529F\u80FD\uFF0C\u6211\u4EEC\u4F1A\u4E8B\u5148\u66F4\u65B0\u672C\u653F\u7B56\uFF0C\u5E76\u5728\u6E38\u620F\u5185\u8BF4\u660E\u3002",
    "4. \u672A\u6210\u5E74\u4EBA",
    "\u672C\u6E38\u620F\u5EFA\u8BAE 12 \u5468\u5C81\u53CA\u4EE5\u4E0A\u7684\u73A9\u5BB6\u4F7F\u7528\u3002\u672A\u6EE1 18 \u5468\u5C81\u7684\u672A\u6210\u5E74\u4EBA\u5E94\u5728\u76D1\u62A4\u4EBA\u540C\u610F\u548C\u6307\u5BFC\u4E0B\u4F7F\u7528\u3002\u6211\u4EEC\u4E0D\u4F1A\u4E3B\u52A8\u6536\u96C6\u672A\u6210\u5E74\u4EBA\u7684\u4E2A\u4EBA\u8EAB\u4EFD\u4FE1\u606F\u3002\u66F4\u5177\u4F53\u7684\u5185\u5BB9\u8BF4\u660E\u89C1\u300A\u9002\u9F84\u63D0\u793A\u300B\u3002",
    "5. \u4F60\u7684\u9009\u62E9",
    "\u4F60\u53EF\u4EE5\u968F\u65F6\u505C\u6B62\u4F7F\u7528\u672C\u6E38\u620F\u3002\u4F60\u4E5F\u53EF\u4EE5\u901A\u8FC7\u6D4F\u89C8\u5668\u7684\u7AD9\u70B9\u6570\u636E/\u7F13\u5B58\u6E05\u7406\u529F\u80FD\uFF0C\u5220\u9664\u672C\u6E38\u620F\u4FDD\u5B58\u5728\u672C\u5730\u7684\u6210\u7EE9\u548C\u97F3\u6548\u8BBE\u7F6E\u3002",
    "6. \u653F\u7B56\u53D8\u66F4",
    "\u82E5\u672C\u653F\u7B56\u6709\u66F4\u65B0\uFF0C\u6211\u4EEC\u4F1A\u4FEE\u6539\u672C\u9875\u7684\u751F\u6548\u65E5\u671F\uFF0C\u5E76\u5728\u6E38\u620F\u5185\u516C\u5E03\u66F4\u65B0\u540E\u7684\u8BF4\u660E\u3002\u5728\u66F4\u65B0\u751F\u6548\u540E\u7EE7\u7EED\u4F7F\u7528\u672C\u6E38\u620F\uFF0C\u5373\u8868\u793A\u4F60\u4E86\u89E3\u66F4\u65B0\u540E\u7684\u505A\u6CD5\u3002"
  ];
  var LEGAL_AGE_TITLE = "\u9002\u9F84\u63D0\u793A";
  var LEGAL_AGE = [
    "\u6E38\u620F\u540D\u79F0\uFF1A\u8DEF\u53E3\u706B\u529B",
    "\u9002\u9F84\u8303\u56F4\uFF1A12 \u5468\u5C81\u53CA\u4EE5\u4E0A",
    "\u672C\u63D0\u793A\u7528\u4E8E\u8BF4\u660E\u6E38\u620F\u7684\u4E3B\u8981\u5185\u5BB9\uFF0C\u5E2E\u52A9\u76D1\u62A4\u4EBA\u548C\u73A9\u5BB6\u5224\u65AD\u662F\u5426\u9002\u5408\u6E38\u73A9\u3002\u5982\u672C\u6E38\u620F\u65E5\u540E\u63D0\u4EA4\u5E94\u7528\u5546\u5E97\u6216\u5C0F\u6E38\u620F\u5E73\u53F0\u5BA1\u6838\uFF0C\u6700\u7EC8\u9002\u9F84\u6807\u8BC6\u4EE5\u5E73\u53F0\u5BA1\u6838\u7ED3\u679C\u4E3A\u51C6\u3002",
    "\u5185\u5BB9\u8BF4\u660E",
    "\u8FD9\u662F\u4E00\u6B3E\u5361\u901A\u3001Q \u7248\u753B\u98CE\u7684\u4F11\u95F2\u5C04\u51FB\u6E38\u620F\u3002\u73A9\u5BB6\u5DE6\u53F3\u79FB\u52A8\u5C0F\u961F\uFF0C\u5C04\u51FB\u4E3A\u81EA\u52A8\u8FDB\u884C\uFF0C\u76EE\u6807\u662F\u5728\u8DEF\u53E3\u4E24\u4FA7\u5C3D\u53EF\u80FD\u575A\u6301\u66F4\u4E45\u3002",
    "\u6E38\u620F\u4E2D\u4F1A\u51FA\u73B0\u5361\u901A\u98CE\u683C\u7684\u611F\u67D3\u4F53\u548C\u8F7B\u5EA6\u5BF9\u6297\uFF0C\u4F46\u6CA1\u6709\u5199\u5B9E\u8840\u8165\u3001\u80A2\u89E3\u6216\u8FC7\u5EA6\u6050\u6016\u7684\u8868\u73B0\uFF0C\u4E5F\u4E0D\u4F7F\u7528\u76F8\u5173\u7684\u5199\u5B9E\u5316\u7528\u8BED\u3002",
    "\u6E38\u620F\u8FC7\u7A0B\u4E2D\u53EF\u80FD\u51FA\u73B0\u65F6\u95F4\u538B\u529B\u3001\u5173\u5361\u4E8B\u4EF6\u548C\u5931\u8D25\u7ED3\u7B97\uFF0C\u90E8\u5206\u573A\u666F\uFF08\u4F8B\u5982\u591C\u95F4\u8DEF\u53E3\u3001\u7A81\u7136\u6765\u88AD\uFF09\u53EF\u80FD\u5E26\u6765\u8F7B\u5EA6\u7D27\u5F20\uFF0C\u4F46\u4E0D\u542B\u6050\u6016\u9898\u6750\u3002",
    "\u672C\u6E38\u620F\u6CA1\u6709\u73A9\u5BB6\u4E4B\u95F4\u7684\u804A\u5929\u3001\u7EC4\u961F\u6216\u7528\u6237\u751F\u6210\u5185\u5BB9\uFF0C\u4E5F\u4E0D\u4F1A\u5F15\u5BFC\u6DFB\u52A0\u964C\u751F\u4EBA\u3002",
    "\u672C\u7248\u672C\u6CA1\u6709\u5185\u8D2D\uFF0C\u4E5F\u4E0D\u51FA\u552E\u968F\u673A\u62BD\u53D6\u7C7B\u9053\u5177\u3002\u5E7F\u544A\u80FD\u529B\u5F53\u524D\u5173\u95ED\u3002",
    "\u6E38\u620F\u4F1A\u5728\u672C\u5730\u4FDD\u5B58\u6700\u597D\u6210\u7EE9\u548C\u97F3\u6548\u8BBE\u7F6E\uFF0C\u4E0D\u8981\u6C42\u521B\u5EFA\u8D26\u53F7\u3002",
    "\u4F7F\u7528\u5EFA\u8BAE",
    "\u8BF7\u5408\u7406\u5B89\u6392\u6E38\u620F\u65F6\u95F4\uFF0C\u907F\u514D\u957F\u65F6\u95F4\u8FDE\u7EED\u6E38\u73A9\u3002",
    "\u672A\u6EE1 18 \u5468\u5C81\u7684\u73A9\u5BB6\uFF0C\u5EFA\u8BAE\u5728\u76D1\u62A4\u4EBA\u6307\u5BFC\u4E0B\u4F7F\u7528\uFF0C\u5E76\u9075\u5B88\u5F53\u5730\u5173\u4E8E\u672A\u6210\u5E74\u4EBA\u4F7F\u7528\u7F51\u7EDC\u548C\u6E38\u620F\u7684\u76F8\u5173\u89C4\u5B9A\u3002",
    "\u5982\u5BF9\u5185\u5BB9\u6216\u9002\u9F84\u8303\u56F4\u6709\u7591\u95EE\uFF0C\u8BF7\u53D1\u4FE1\u81F3 pengnanhu81@gmail.com\u3002",
    "\u672C\u63D0\u793A\u53D1\u5E03\u4E8E 2026 \u5E74 11 \u6708 26 \u65E5\u3002"
  ];
  function legalParagraphs(page) {
    if (page === "privacy") return { title: LEGAL_PRIVACY_TITLE, lines: LEGAL_PRIVACY };
    if (page === "age") return { title: LEGAL_AGE_TITLE, lines: LEGAL_AGE };
    return { title: LEGAL_SUMMARY_TITLE, lines: LEGAL_SUMMARY };
  }

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
  var NIGHT_TREE_ZS = [18, 29, 48, 67, 86];
  var NIGHT_HOUSE_ZS = [14, 21, 31, 41, 50, 61, 73, 88];
  var FORK_HOUSE_ZS = [16, 28, 40, 55, 69, 84];
  function isNight(scene) {
    return scene === "night" || scene === "fork";
  }
  function drawWorld(ctx, camX, time, shakeX, shakeY, scene = "day", hold = false) {
    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawSky(ctx, camX, scene);
    const grass = ctx.createLinearGradient(0, HORIZON_Y, 0, CANVAS_H);
    if (scene === "fork") {
      grass.addColorStop(0, "#2E3A4E");
      grass.addColorStop(0.45, "#243446");
      grass.addColorStop(1, "#1C2A38");
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
    drawRoadside(ctx, camX, time, scene);
    if (isNight(scene)) drawLamps(ctx, camX, time);
    ctx.restore();
  }
  function drawSky(ctx, camX, scene = "day") {
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
      ctx.fillStyle = scene === "fork" ? "rgba(10, 16, 40, 0.62)" : "rgba(18, 24, 48, 0.55)";
      ctx.fillRect(0, 0, CANVAS_W, horizon + 24);
      ctx.fillStyle = "rgba(255,245,210,0.8)";
      for (let i = 0; i < 14; i++) {
        const sx = (i * 97 + 40) % CANVAS_W;
        const sy = 24 + i * 37 % 220;
        ctx.beginPath();
        ctx.arc(sx, sy, i % 3 === 0 ? 2.1 : 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  function drawRoad(ctx, camX, time, scene = "day") {
    const far = pr(-ROAD_HALF, 0, SPAWN_Z + 10, camX);
    const farR = pr(ROAD_HALF, 0, SPAWN_Z + 10, camX);
    const near = pr(-ROAD_HALF, 0, 8.5, camX);
    const nearR = pr(ROAD_HALF, 0, 8.5, camX);
    ctx.fillStyle = scene === "night" ? "#4A5160" : "#8E9198";
    ctx.beginPath();
    ctx.moveTo(far.sx, far.sy);
    ctx.lineTo(farR.sx, farR.sy);
    ctx.lineTo(nearR.sx, nearR.sy);
    ctx.lineTo(near.sx, near.sy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = scene === "night" ? "#8A8070" : "#D9CDB6";
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
    if (scene === "day") {
      drawDashLine(ctx, 0, camX, "#F3EEDC", 7, time);
    } else if (scene === "night") {
      drawMedian(ctx, camX, 0.7, "#5C6574");
      drawDashLine(ctx, -2.15, camX, "#D6C98A", 5, time);
      drawDashLine(ctx, 2.15, camX, "#D6C98A", 5, time);
    } else {
      drawMedian(ctx, camX, 1.35, "#6A5A3A");
      drawDashLine(ctx, -2.55, camX, "#E8D48A", 5, time);
      drawDashLine(ctx, 2.55, camX, "#E8D48A", 5, time);
      drawDashLine(ctx, 0, camX, "#F4E7B0", 6, time);
    }
  }
  function drawMedian(ctx, camX, half, color) {
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
  function drawForkPlaza(ctx, camX, time, hold) {
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
  function drawCrossAlley(ctx, camX, time) {
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
  function drawLamps(ctx, camX, time) {
    const zs = [16, 26, 36, 46, 56, 68];
    for (let i = 0; i < zs.length; i++) {
      const z = wrapZ(zs[i], time, 12, 80);
      for (const side of [-1, 1]) {
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
  function drawRoadside(ctx, camX, time, scene = "day") {
    const props = [];
    const trees = scene === "day" ? TREE_ZS : scene === "night" ? NIGHT_TREE_ZS : [];
    const houses = scene === "day" ? HOUSE_ZS : scene === "night" ? NIGHT_HOUSE_ZS : FORK_HOUSE_ZS;
    const treeSpan = scene === "night" ? 100 : 92;
    const houseSpan = scene === "fork" ? 102 : 94;
    for (let i = 0; i < trees.length; i++) {
      props.push({ kind: "tree", side: -1, z: wrapZ(trees[i], time, 11, treeSpan), variant: i % 2 });
      if (scene === "day") {
        props.push({ kind: "tree", side: 1, z: wrapZ(trees[i] + 3.4, time, 11, treeSpan), variant: (i + 1) % 2 });
      }
    }
    for (let i = 0; i < houses.length; i++) {
      const off = scene === "night" ? 7.2 : scene === "fork" ? 9 : 5.5;
      props.push({ kind: "house", side: -1, z: wrapZ(houses[i], time, 14, houseSpan), variant: scene === "day" ? i % 4 : (i + 1) % 4 });
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
        const id = p.variant === 0 ? "tree_0" : "tree_1";
        drawSprite(ctx, id, q.sx, q.sy + 4 * k, 170 * k, { flip: p.side > 0 });
      } else {
        const inset = scene === "fork" ? 5.6 : scene === "night" ? 3.55 : 4.35;
        const x = p.side < 0 ? -ROAD_HALF - inset : ROAD_HALF + inset + 0.1;
        const q = pr(x, 0, p.z, camX);
        const k = q.scale;
        if (k < 0.08) continue;
        const id = "house_" + p.variant;
        const h = scene === "night" ? 250 * k : scene === "fork" ? 260 * k : 230 * k;
        drawSprite(ctx, id, q.sx, q.sy + 6 * k, h, { flip: p.side > 0 });
      }
    }
  }
  function drawGate(ctx, g, camX) {
    const p = pr(g.x, 0, g.z, camX);
    const k = p.scale;
    const id = g.kind === "red" ? "gate_coral" : g.kind === "weapon" || g.kind === "amp" ? "gate_gold" : "gate_blue";
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
    fallbackGate(ctx, p.sx, p.sy, k, g);
  }
  function drawGateLabel(ctx, label, x, y, k, danger, gold = false) {
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
  function fallbackGate(ctx, sx, sy, k, g) {
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
  function drawEnemy(ctx, e, camX) {
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
      const frame = Math.sin(e.walk) >= 0 ? "walker_0" : "walker_1";
      const h = 122 * k;
      if (!drawSprite(ctx, frame, 0, 0, h, { flash })) {
        fallbackEnemy(ctx, k, false, flash);
      }
    } else {
      drawSpecialEnemy(ctx, e, k * stretch, flash);
    }
    ctx.restore();
  }
  function clayBody(ctx, k, flash, color, bodyW, bodyH, headR, headY) {
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
  function drawEnemyLabel(ctx, text, k, y, color) {
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.max(11, 15 * k)}px "PingFang SC","Microsoft YaHei",sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, y);
  }
  function drawSpecialEnemy(ctx, e, k, flash) {
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
      drawEnemyLabel(ctx, "\u76FE", k, -78 * k, "#2C3A52");
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
      drawEnemyLabel(ctx, "\u7206", k, -78 * k, "#7A2A10");
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
        drawEnemyLabel(ctx, "\u88C2", k, -80 * k, "#1F4A44");
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
      drawEnemyLabel(ctx, "\u8DF3", k, -84 * k, "#3E5A10");
      return;
    }
    fallbackEnemy(ctx, k, false, flash);
  }
  function fallbackEnemy(ctx, k, sprint, flash) {
    ctx.fillStyle = flash > 0 ? "#FFFFFF" : sprint ? "#7BA24A" : "#9FD6B0";
    drawEllipse(ctx, 0, -28 * k, sprint ? 16 * k : 22 * k, sprint ? 22 * k : 24 * k);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, sprint ? -52 * k : -56 * k, sprint ? 13 * k : 16 * k, 0, Math.PI * 2);
    ctx.fill();
  }
  function drawLaneWarning(ctx, lane, camX, timeLeft, kind = "warn") {
    const x = lane === "mid" ? 0 : lane === "left" ? -LANE_X : LANE_X;
    const farL = pr(x - 2.4, 0, SPAWN_Z - 4, camX);
    const farR = pr(x + 2.4, 0, SPAWN_Z - 4, camX);
    const nearL = pr(x - 2.4, 0, 10, camX);
    const nearR = pr(x + 2.4, 0, 10, camX);
    const pulse = 0.18 + Math.max(0, 1.2 - timeLeft) * 0.16 + Math.sin(timeLeft * 16) * 0.05;
    const alpha = Math.max(0.12, Math.min(0.42, pulse));
    ctx.save();
    ctx.fillStyle = kind === "rush" ? `rgba(210, 128, 32, ${alpha})` : kind === "alley" ? `rgba(120, 80, 200, ${alpha})` : kind === "hold" ? `rgba(230, 190, 70, ${alpha + 0.08})` : `rgba(210, 48, 40, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(farL.sx, farL.sy);
    ctx.lineTo(farR.sx, farR.sy);
    ctx.lineTo(nearR.sx, nearR.sy);
    ctx.lineTo(nearL.sx, nearL.sy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  function drawProp(ctx, p, camX) {
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
      ctx.fillText("\u6CB9\u6876", 0, -72 * k);
      drawPropHp(ctx, p, 24 * k, k);
    }
    ctx.restore();
  }
  function drawPropHp(ctx, p, y, k) {
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
  function drawSoldier(ctx, sx, sy, scale, bob, flash, weapon) {
    const k = scale;
    const bounce = Math.sin(bob) * 2.6 * k;
    const frame = Math.sin(bob) >= 0 ? 0 : 1;
    const id = weapon === "pistol" ? frame === 0 ? "soldier_pistol_0" : "soldier_pistol_1" : frame === 0 ? "soldier_smg_0" : "soldier_smg_1";
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
    const rate = weapon === "smg" ? 7.2 : weapon === "heavy" ? 2.4 : 3.4;
    if (Math.sin(bob * rate) > 0.55) {
      const mz = muzzleOf(id);
      const mx = (mz[0] - 0.5) * size.w;
      const my = -h + mz[1] * h;
      drawMuzzleFlash(ctx, mx, my, k * (weapon === "heavy" ? 1.45 : weapon === "smg" ? 1.15 : 1));
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
    const weapon = squad.weapon;
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
  function drawBullet(ctx, b, camX) {
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
    var _a, _b, _c, _d, _e;
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
    const extra = hud.weapon !== "pistol" ? "  " + Math.ceil(Math.max(0, hud.weaponTime)) + "s" : "";
    const midW = 230;
    const midX = (CANVAS_W - midW) / 2;
    const wcolor = hud.weapon === "heavy" ? "rgba(255,214,170,0.96)" : hud.weapon === "smg" ? "rgba(255,236,190,0.96)" : "rgba(255,248,230,0.94)";
    pill(ctx, midX, 48, midW, 60, wcolor);
    const iconId = hud.weapon === "pistol" ? "icon_pistol" : "icon_smg";
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
    pill(ctx, CANVAS_W - 206, 118, 172, 36, "rgba(255,248,230,0.94)");
    ctx.fillStyle = "#5A3E22";
    ctx.font = 'bold 18px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("\u51FB\u6740 " + ((_a = hud.kills) != null ? _a : 0), CANVAS_W - 120, 137);
    if (hud.fireBonus > 0) {
      pill(ctx, 36, 122, 200, 36, "rgba(86,160,90,0.94)");
      ctx.fillStyle = "#FFFFFF";
      ctx.font = 'bold 18px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = "left";
      ctx.fillText("\u5C04\u901F\u63D0\u5347 " + hud.fireBonus.toFixed(1) + "s", 52, 141);
    }
    if (hud.shieldTime && hud.shieldTime > 0) {
      const y = hud.fireBonus > 0 ? 164 : 122;
      pill(ctx, 36, y, 200, 36, "rgba(70,140,200,0.94)");
      ctx.fillStyle = "#FFFFFF";
      ctx.font = 'bold 18px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = "left";
      ctx.fillText("\u62A4\u76FE " + hud.shieldTime.toFixed(1) + "s", 52, y + 19);
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
    const banner = hud.banner || (hud.warning ? hud.warning.lane === "left" ? "\u8EB2\u5F00\u5DE6\u9053\uFF01" : "\u8EB2\u5F00\u53F3\u9053\uFF01" : hud.rush ? "\u5DE6\u9053\u6765\u88AD\uFF01" : null);
    if (banner) {
      const warn = banner.startsWith("\u8EB2\u5F00");
      const rush = banner.includes("\u6765\u88AD") || banner.includes("\u5939\u51FB");
      const pulse = 0.72 + Math.sin(((_e = (_d = (_b = hud.warning) == null ? void 0 : _b.timeLeft) != null ? _d : (_c = hud.rush) == null ? void 0 : _c.timeLeft) != null ? _e : 0.4) * 18) * 0.16;
      const color = warn ? `rgba(180,36,32,${pulse})` : rush ? `rgba(196,110,24,${pulse})` : banner.includes("\xD72") ? `rgba(196,150,24,${pulse})` : `rgba(70,80,150,${pulse})`;
      pill(ctx, 90, 164, CANVAS_W - 180, 84, color);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = 'bold 40px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(banner, CANVAS_W / 2, 208);
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
  var LEGAL_BACK_Y = CANVAS_H - 132;
  var LEGAL_LINK_Y = CANVAS_H - 214;
  function legalMaxScroll(page) {
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
  function drawLegal(ctx, page = "summary", scrollY = 0) {
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
      drawButton(ctx, 80, LEGAL_LINK_Y, 250, 58, "#6B8F3A", "\u9690\u79C1\u653F\u7B56");
      drawButton(ctx, CANVAS_W - 80 - 250, LEGAL_LINK_Y, 250, 58, "#6B8F3A", "\u9002\u9F84\u63D0\u793A");
    }
    drawButton(ctx, CANVAS_W / 2 - 110, LEGAL_BACK_Y, 220, 64, "#6B8F3A", "\u8FD4\u56DE");
  }
  function legalHit(x, y, page = "summary") {
    if (x >= CANVAS_W / 2 - 110 && x <= CANVAS_W / 2 + 110 && y >= LEGAL_BACK_Y && y <= LEGAL_BACK_Y + 64) return "back";
    if (page === "summary") {
      if (x >= 80 && x <= 330 && y >= LEGAL_LINK_Y && y <= LEGAL_LINK_Y + 58) return "privacy";
      if (x >= CANVAS_W - 80 - 250 && x <= CANVAS_W - 80 && y >= LEGAL_LINK_Y && y <= LEGAL_LINK_Y + 58) return "age";
    }
    return null;
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
  function wrapTextLeft(ctx, text, x, y, maxW, lineH) {
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
      this.shieldTime = 0;
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
      this.shieldTime = 0;
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
      if (overflow > 0) {
        this.fireBonus = OVERFLOW_BONUS_DURATION;
        this.shieldTime = Math.max(this.shieldTime, OVERFLOW_SHIELD_DURATION);
      }
      return { applied, overflow };
    }
    add(n) {
      return this.grow(this.count + n);
    }
    mul(n) {
      return this.grow(this.count * n);
    }
    get shielded() {
      return this.shieldTime > 0;
    }
    grantShield(duration) {
      this.shieldTime = Math.max(this.shieldTime, duration);
    }
    lose(n) {
      let lost = n;
      if (this.shielded) lost = Math.max(1, Math.ceil(n * SHIELD_DAMAGE_MUL));
      this.setCount(Math.max(0, this.count - lost));
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
      if (this.shieldTime > 0) this.shieldTime = Math.max(0, this.shieldTime - dt);
      if (this.weapon !== "pistol") {
        this.weaponTime -= dt;
        if (this.weaponTime <= 0) {
          if (this.count >= MAX_SQUAD) this.grantShield(CAP_EXPIRE_SHIELD);
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
      this.props = new Props();
      this.particles = new Particles();
      this.cursor = 0;
      this.propCursor = 0;
      this.pendingPairs = /* @__PURE__ */ new Map();
      this.nextHordeAt = 0;
      this.nextGateAt = 0;
      this.endlessGateI = 0;
      this.endlessMixI = 0;
      this.nextPropAt = 0;
      this.endlessPropI = 0;
      this.hordeSkipUntil = 0;
      this.goldSpawned = false;
      this.warningLane = null;
      this.warningImpactAt = 0;
      this.nextWarningAt = 0;
      this.rushActive = false;
      this.rushSpawnAt = 0;
      this.rushUntil = 0;
      this.rushSpawned = false;
      this.nextRushAt = 0;
      this.runSeed = 1;
      this.scene = "day";
      this.bannerText = null;
      this.legalPage = "summary";
      this.legalScroll = 0;
      this.firstRushDone = false;
      this.quietUntil = 0;
      this.mercySpawned = false;
      this.goldExpiresAt = 0;
      this.nextGoldWindowI = 0;
      this.namedKind = null;
      this.namedSpawnAt = 0;
      this.namedUntil = 0;
      this.namedSpawned = false;
      this.nextPincerI = 0;
      this.nextAlleyI = 0;
      this.nextPincerAt = 0;
      this.nextAlleyAt = 0;
      this.exclusiveUntil = 0;
      this.goldSafeUntil = 0;
      this.rightHoldUntil = 0;
      this.goldWindowOpen = false;
      this.holdStarted = false;
      this.holdUntil = 0;
      this.nextHoldAt = 0;
      this.alleyFacing = "both";
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
          hp: e.hp,
          airborne: e.airborne
        })),
        bullets: this.bullets.pool.size,
        remain: this.time,
        warning: this.warningLane ? {
          lane: this.warningLane,
          timeLeft: Math.max(0, this.warningImpactAt - this.time),
          text: this.warningLane === "left" ? "\u8EB2\u5F00\u5DE6\u9053\uFF01" : "\u8EB2\u5F00\u53F3\u9053\uFF01"
        } : null,
        rush: this.rushActive ? { timeLeft: Math.max(0, this.rushSpawnAt - this.time), spawned: this.rushSpawned } : null,
        banner: this.currentBanner() ? { text: this.currentBanner() } : null,
        scene: this.scene,
        shieldTime: this.squad.shieldTime,
        quiet: this.time < this.quietUntil,
        goldSafe: this.time < this.goldSafeUntil,
        hold: this.namedKind === "hold" || this.holdStarted && this.time < this.holdUntil,
        legalPage: this.legalPage,
        legalScroll: this.legalScroll,
        props: this.props.pool.active.map((p) => ({
          kind: p.kind,
          lane: p.lane,
          z: p.z,
          hp: p.hp
        }))
      };
    }
    beginRun(seed) {
      this.state = "playing";
      this.time = 0;
      this.runSeed = seed != null ? seed >>> 0 || 1 : (Math.random() * 2147483647 | 0) + 1;
      this.kills = 0;
      this.hint = true;
      this.hintTimer = 0;
      this.shake = 0;
      this.cursor = 0;
      this.propCursor = 0;
      this.pendingPairs.clear();
      this.nextHordeAt = SCRIPT_ENEMY_END + 0.28;
      this.nextGateAt = ENDLESS_GATE_START;
      this.endlessGateI = 0;
      this.endlessMixI = 0;
      this.nextPropAt = ENDLESS_PROP_START;
      this.endlessPropI = 0;
      this.hordeSkipUntil = 0;
      this.goldSpawned = false;
      this.warningLane = null;
      this.warningImpactAt = 0;
      this.nextWarningAt = WARNING_FIRST;
      this.rushActive = false;
      this.rushSpawnAt = 0;
      this.rushUntil = 0;
      this.rushSpawned = false;
      this.nextRushAt = RUSH_FIRST;
      this.scene = "day";
      this.bannerText = null;
      this.firstRushDone = false;
      this.quietUntil = 0;
      this.mercySpawned = false;
      this.goldExpiresAt = 0;
      this.nextGoldWindowI = 0;
      this.namedKind = null;
      this.namedSpawnAt = 0;
      this.namedUntil = 0;
      this.namedSpawned = false;
      this.nextPincerI = 0;
      this.nextAlleyI = 0;
      this.nextPincerAt = pincerTime(0, this.runSeed);
      this.nextAlleyAt = alleyTime(0, this.runSeed);
      this.exclusiveUntil = 0;
      this.goldSafeUntil = 0;
      this.rightHoldUntil = 0;
      this.goldWindowOpen = false;
      this.holdStarted = false;
      this.holdUntil = 0;
      this.nextHoldAt = holdTime(this.runSeed);
      this.alleyFacing = "both";
      this.spawned.length = 0;
      this.squad.reset();
      this.enemies.clear();
      this.bullets.clear();
      this.gates.clear();
      this.props.clear();
      this.particles.clear();
      this.squad.x = LANE_X;
      this.input.targetX = LANE_X;
      this.input.swiped = false;
      ads.enabled = false;
    }
    update(dt) {
      const clicks = this.input.consumeClicks();
      for (const c of clicks) this.handleClick(c.x, c.y);
      if (this.state === "legal") {
        this.legalScroll += this.input.consumeScroll(dt);
        const max = legalMaxScroll(this.legalPage);
        if (this.legalScroll > 0) this.legalScroll = 0;
        if (this.legalScroll < -max) this.legalScroll = -max;
      }
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
      this.spawnMercy();
      this.updateGold();
      this.spawnPropsDue();
      this.updateScene();
      this.updateWarning();
      this.updateRush();
      this.updateNamed();
      this.updateAlleyDrift();
      this.updateHold();
      this.gates.update(dt);
      this.props.update(dt);
      const rightMul = this.time < this.rightHoldUntil ? 0 : 1;
      this.enemies.update(dt, rightMul);
      this.shoot(dt);
      this.bullets.update(dt);
      this.collideBullets();
      this.collideGates();
      this.collideProps();
      this.collideEnemies();
      this.particles.update(dt);
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
      if (this.squad.count <= 0) {
        this.endRun();
        return;
      }
    }
    spawnDue() {
      const quiet = this.time < this.quietUntil;
      const holdRight = this.time < this.hordeSkipUntil || this.time < this.rightHoldUntil;
      while (this.cursor < TIMELINE.length && TIMELINE[this.cursor].time <= this.time) {
        const ev = TIMELINE[this.cursor++];
        if (ev.kind === "enemy" && (quiet || holdRight && ev.lane === "right")) continue;
        this.applyEvent(ev);
        this.spawned.push(ev);
      }
    }
    /** 脚本段结束后继续出怪和补门，直到人数归零 */
    spawnEndless() {
      while (this.time >= this.nextHordeAt) {
        const t = this.nextHordeAt;
        if (t >= this.hordeSkipUntil && t >= this.quietUntil && !inRightLaneGap(t)) {
          const a = ENDLESS_MIX[this.endlessMixI % ENDLESS_MIX.length];
          const b = ENDLESS_MIX[(this.endlessMixI + 1) % ENDLESS_MIX.length];
          this.spawnEnemy(a, "right");
          this.spawnEnemy(b, "right");
          this.endlessMixI += 2;
        }
        this.nextHordeAt += endlessHordeInterval(t);
      }
      while (this.time >= this.nextGateAt) {
        const t = this.nextGateAt;
        const raw = endlessGateFor(this.endlessGateI, this.runSeed);
        const ev = softenGate(raw, t, this.squad.count, this.squad.peak);
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
        this.nextGateAt += t >= SCENE_SHIFT_AT ? ENDLESS_GATE_PERIOD_LATE : ENDLESS_GATE_PERIOD;
      }
    }
    spawnEnemy(type, lane, opts) {
      return this.enemies.spawn(type, lane, {
        ...opts,
        hpMul: enemyHpMul(this.time)
      });
    }
    spawnMercy() {
      if (this.mercySpawned || this.time < MERCY_AT) return;
      if (this.squad.count > MERCY_MAX_COUNT) {
        this.mercySpawned = true;
        return;
      }
      this.mercySpawned = true;
      const mid = Math.abs(this.squad.x) < 1.2;
      const lane = laneOfX(this.squad.x);
      if (mid) {
        const pair = this.gates.nextPairKey();
        this.gates.spawn({ kind: "add", lane: "left", value: 2, label: "+2", pairKey: pair, z: MERCY_Z });
        this.gates.spawn({ kind: "add", lane: "right", value: 2, label: "+2", pairKey: pair, z: MERCY_Z });
      } else {
        this.gates.spawn({ kind: "add", lane, value: 2, label: "+2", z: MERCY_Z });
      }
    }
    updateGold() {
      if (!this.goldSpawned && this.time >= GOLD_GATE_AT) {
        this.goldSpawned = true;
        this.gates.spawn({
          kind: "amp",
          lane: "right",
          label: "\xD72",
          z: GOLD_GATE_Z,
          stationary: true
        });
        this.goldExpiresAt = GOLD_GATE_AT + GOLD_GATE_LIFE;
      }
      if (this.goldExpiresAt > 0 && this.time >= this.goldExpiresAt) {
        const wasWindow = this.goldWindowOpen;
        this.clearAmpGates();
        this.goldExpiresAt = 0;
        this.goldWindowOpen = false;
        if (this.namedKind === "gold") {
          this.namedKind = null;
          this.bannerText = null;
        }
        if (wasWindow && this.time >= this.exclusiveUntil) {
          this.showNamed("goldEnd", "\u91D1\u95E8\u5173\u95ED\uFF01", GOLD_CLOSE_BANNER, void 0, true);
        }
      }
      const due = goldWindowTime(this.nextGoldWindowI, this.runSeed);
      if (this.time >= due && this.time >= GOLD_GATE_AT + GOLD_GATE_LIFE) {
        if (this.time < this.exclusiveUntil) return;
        if (this.warningLane || this.rushActive || this.namedKind === "pincer" || this.namedKind === "alley" || this.namedKind === "hold") {
          return;
        }
        if (this.nextPincerAt - this.time < 4.2 && this.nextPincerAt >= this.time - 0.2) {
          return;
        }
        this.nextGoldWindowI += 1;
        this.clearAmpGates();
        this.gates.spawn({
          kind: "amp",
          lane: "right",
          label: "\xD72",
          z: GOLD_WINDOW_Z,
          stationary: true
        });
        this.goldExpiresAt = this.time + GOLD_WINDOW_LIFE;
        this.goldWindowOpen = true;
        this.hordeSkipUntil = Math.max(this.hordeSkipUntil, this.time + GOLD_WINDOW_LULL);
        this.rightHoldUntil = Math.max(this.rightHoldUntil, this.time + GOLD_WINDOW_LULL);
        this.goldSafeUntil = Math.max(this.goldSafeUntil, this.time + GOLD_WINDOW_SAFE);
        this.thinRightColumn();
        this.showNamed("gold", "\u53F3\u9053\xD72\uFF01\u5FEB\u5207", 2.8, void 0, true);
      }
    }
    thinRightColumn() {
      const list = this.enemies.pool.active.slice();
      let kept = 0;
      for (const e of list) {
        if (!e.alive || e.x <= 0.15) continue;
        if (e.z < 18) continue;
        if (e.z <= 52 && kept >= 1) {
          this.particles.puff(e.x, 0.4, e.z, "#C9C0B0");
          this.enemies.pool.release(e);
          continue;
        }
        if (e.z <= 52) kept += 1;
      }
    }
    clearAmpGates() {
      const list = this.gates.pool.active.slice();
      for (const g of list) {
        if (g.kind === "amp") this.gates.pool.release(g);
      }
    }
    updateScene() {
      if (this.scene === "day" && this.time >= SCENE_SHIFT_AT) {
        this.scene = "night";
        this.grantNightStart();
        this.pushEventsPast(this.time + SCENE_BANNER + 1.6);
        this.showNamed("scene", "\u8FDB\u5165\u591C\u8DEF\u53E3\uFF01", SCENE_BANNER, void 0, true);
      }
    }
    grantNightStart() {
      if (this.squad.weapon === "pistol" || this.squad.weaponTime < NIGHT_WEAPON_MIN) {
        this.squad.equip("heavy");
      }
      this.squad.grantShield(NIGHT_SHIELD_DURATION);
    }
    pushEventsPast(until) {
      if (this.nextWarningAt < until) this.nextWarningAt = until + 0.4;
      if (this.nextRushAt < until) this.nextRushAt = until + 0.8;
      if (this.nextPincerAt < until) this.nextPincerAt = until + 1.2;
      if (this.nextAlleyAt < until) this.nextAlleyAt = until + 1.8;
      if (this.nextHoldAt < until + 4) this.nextHoldAt = until + 6;
    }
    showNamed(kind, text, duration, spawnAt, exclusive = false) {
      this.namedKind = kind;
      this.bannerText = text;
      this.namedUntil = this.time + duration;
      this.namedSpawned = spawnAt == null;
      this.namedSpawnAt = spawnAt != null ? spawnAt : this.time;
      if (exclusive) this.exclusiveUntil = Math.max(this.exclusiveUntil, this.namedUntil);
    }
    currentBanner() {
      const exclusiveNamed = this.namedKind === "scene" || this.namedKind === "gold" || this.namedKind === "goldEnd" || this.namedKind === "hold";
      if (exclusiveNamed && this.time < this.namedUntil && this.bannerText) return this.bannerText;
      if (this.warningLane) return this.warningLane === "left" ? "\u8EB2\u5F00\u5DE6\u9053\uFF01" : "\u8EB2\u5F00\u53F3\u9053\uFF01";
      if (this.rushActive) return "\u5DE6\u9053\u6765\u88AD\uFF01";
      if (this.namedKind && this.time < this.namedUntil && this.bannerText) return this.bannerText;
      return null;
    }
    updateNamed() {
      if (this.namedKind && this.time >= this.namedUntil && this.namedSpawned) {
        if (this.namedKind === "pincer") {
          this.nextPincerI += 1;
          this.nextPincerAt = pincerTime(this.nextPincerI, this.runSeed);
        }
        if (this.namedKind === "alley") {
          this.nextAlleyI += 1;
          this.nextAlleyAt = alleyTime(this.nextAlleyI, this.runSeed);
        }
        this.namedKind = null;
        this.bannerText = null;
      }
      if (this.namedKind === "pincer" && !this.namedSpawned && this.time >= this.namedSpawnAt) {
        this.spawnPincerPack();
        this.namedSpawned = true;
      }
      if (this.namedKind === "alley" && !this.namedSpawned && this.time >= this.namedSpawnAt) {
        this.spawnAlleyPack();
        this.namedSpawned = true;
      }
      if (this.namedKind === "hold" && !this.namedSpawned && this.time >= this.namedSpawnAt) {
        this.namedSpawned = true;
      }
      if (this.namedKind || this.warningLane || this.rushActive || this.time < this.quietUntil) return;
      if (this.time < this.exclusiveUntil || this.time < this.goldSafeUntil) return;
      if (this.time >= this.nextPincerAt && this.squad.count > 0) {
        this.showNamed("pincer", "\u5DE6\u53F3\u5939\u51FB\uFF01", PINCER_TELEGRAPH + PINCER_BANNER, this.time + PINCER_TELEGRAPH);
        return;
      }
      if (this.time >= this.nextAlleyAt && this.squad.count > 0 && this.scene !== "day") {
        this.alleyFacing = alleySide(this.nextAlleyI, this.runSeed);
        this.showNamed("alley", alleyBannerText(this.alleyFacing), ALLEY_TELEGRAPH + ALLEY_BANNER, this.time + ALLEY_TELEGRAPH);
      }
    }
    updateHold() {
      if (this.holdStarted) {
        if (this.time >= this.holdUntil) {
          this.holdStarted = false;
          if (Math.abs(this.squad.x) > HOLD_MID && this.squad.count > 0) {
            this.squad.lose(HOLD_DAMAGE);
            this.shake = 0.32;
            this.audio.play("red");
          }
        }
        return;
      }
      if (this.scene === "day" || this.time < this.nextHoldAt || this.squad.count <= 0) return;
      if (this.warningLane || this.rushActive || this.namedKind === "pincer" || this.namedKind === "alley") return;
      if (this.time < this.goldSafeUntil) return;
      this.scene = "fork";
      this.holdStarted = true;
      this.holdUntil = this.time + HOLD_TELEGRAPH + HOLD_DURATION;
      this.showNamed("hold", "\u5B88\u4F4F\u4E2D\u9053\uFF01", HOLD_TELEGRAPH + HOLD_DURATION, this.time + HOLD_TELEGRAPH, true);
      this.pushEventsPast(this.holdUntil + 1.4);
    }
    spawnPincerPack() {
      const left = rushPack(this.time);
      const right = this.time >= 80 ? ["shield", "sprinter", "bomber"] : ["walker", "sprinter", "jumper"];
      for (let i = 0; i < left.length; i++) {
        this.spawnEnemy(left[i], "left", { z: RUSH_SPAWN_Z - i * 1.3, x: -LANE_X + (i - 1) * 0.5 });
      }
      for (let i = 0; i < right.length; i++) {
        this.spawnEnemy(right[i], "right", { z: RUSH_SPAWN_Z - i * 1.3, x: LANE_X + (i - 1) * 0.5 });
      }
    }
    spawnAlleyPack() {
      const types = this.time >= 100 ? ["jumper", "bomber", "splitter"] : ["jumper", "walker", "sprinter"];
      const side = this.alleyFacing;
      for (let i = 0; i < types.length; i++) {
        let fromLeft = side === "left" || side === "both" && i % 2 === 0;
        if (side === "right") fromLeft = false;
        const x = fromLeft ? -ALLEY_SIDE_X - i * 0.15 : ALLEY_SIDE_X + i * 0.15;
        this.spawnEnemy(types[i], "mid", {
          z: ALLEY_SPAWN_Z - i * 1.4,
          x,
          driftX: fromLeft ? LANE_X * 0.15 : -LANE_X * 0.15
        });
      }
    }
    updateAlleyDrift() {
    }
    spawnPropsDue() {
      while (this.propCursor < PROP_EVENTS.length && PROP_EVENTS[this.propCursor].time <= this.time) {
        const ev = PROP_EVENTS[this.propCursor++];
        this.props.spawn(ev.kind, ev.lane);
      }
      while (this.time >= this.nextPropAt) {
        const kind = this.endlessPropI % 2 === 0 ? "cage" : "barrel";
        const lane = kind === "cage" ? "left" : "right";
        this.props.spawn(kind, lane);
        this.endlessPropI += 1;
        this.nextPropAt += ENDLESS_PROP_PERIOD;
      }
    }
    scheduleNextWarning(fromTime) {
      let t = fromTime + warningPeriod(fromTime);
      for (let i = 0; i < 4; i++) {
        const impact = t + WARNING_TELEGRAPH;
        if (inRightLaneGap(t) || inRightLaneGap(impact)) {
          t += 2;
          continue;
        }
        break;
      }
      this.nextWarningAt = t;
    }
    updateWarning() {
      if (this.warningLane) {
        if (this.time >= this.warningImpactAt) {
          const lane = this.warningLane;
          this.warningLane = null;
          if (inLane(this.squad.x, lane) && this.squad.count > 0) {
            this.squad.lose(WARNING_DAMAGE);
            this.shake = 0.32;
            this.audio.play("red");
          }
          this.scheduleNextWarning(this.time);
        }
        return;
      }
      if (this.time >= this.nextWarningAt && this.squad.count > 0 && !this.rushActive && !this.namedKind && this.time >= this.quietUntil && this.time >= this.exclusiveUntil) {
        const lane = laneOfX(this.squad.x);
        if (lane === "right" && this.time < this.goldSafeUntil) {
          this.nextWarningAt = this.goldSafeUntil + 0.35;
          return;
        }
        this.warningLane = lane;
        this.warningImpactAt = this.time + WARNING_TELEGRAPH;
      }
    }
    scheduleNextRush(fromTime) {
      let t = fromTime + rushPeriod(fromTime);
      for (let i = 0; i < 6; i++) {
        const spawnAt = t + RUSH_TELEGRAPH;
        const warnHit = this.nextWarningAt;
        const overlapsWarn = warnHit > 0 && Math.abs(spawnAt - warnHit) < 2.4 || warnHit > 0 && Math.abs(t - warnHit) < 2.4 || this.warningImpactAt > 0 && Math.abs(t - (this.warningImpactAt - WARNING_TELEGRAPH)) < 2.4;
        if (inRightLaneGap(t) || inRightLaneGap(spawnAt) || overlapsWarn) {
          t += 2;
          continue;
        }
        break;
      }
      this.nextRushAt = t;
    }
    updateRush() {
      if (this.rushActive) {
        if (!this.rushSpawned && this.time >= this.rushSpawnAt) {
          const pack = rushPack(this.time);
          for (let i = 0; i < pack.length; i++) {
            this.spawnEnemy(pack[i], "left", {
              z: RUSH_SPAWN_Z - i * 1.35,
              x: -LANE_X + (i - 1) * 0.55
            });
          }
          this.rushSpawned = true;
        }
        if (this.time >= this.rushUntil) {
          this.rushActive = false;
          this.rushSpawned = false;
          if (!this.firstRushDone) {
            this.firstRushDone = true;
            this.quietUntil = this.time + RUSH_QUIET;
            this.hordeSkipUntil = Math.max(this.hordeSkipUntil, this.quietUntil);
            this.scheduleNextRush(this.quietUntil);
            if (this.nextWarningAt < this.quietUntil + 1.2) this.nextWarningAt = this.quietUntil + 1.6;
          } else {
            this.scheduleNextRush(this.time);
          }
        }
        return;
      }
      if (this.time >= this.nextRushAt && this.squad.count > 0 && !this.warningLane && !this.namedKind && this.time >= this.quietUntil && this.time >= this.exclusiveUntil) {
        if (this.nextWarningAt - this.time < RUSH_TELEGRAPH + 1.6) {
          this.nextRushAt = this.nextWarningAt + WARNING_TELEGRAPH + 1.2;
          return;
        }
        this.rushActive = true;
        this.rushSpawned = false;
        this.rushSpawnAt = this.time + RUSH_TELEGRAPH;
        this.rushUntil = this.time + RUSH_BANNER;
      }
    }
    applyEvent(ev) {
      var _a;
      if (ev.kind === "enemy" && ev.enemy) {
        this.spawnEnemy(ev.enemy, ev.lane);
        return;
      }
      if (ev.kind === "gate" && ev.gate) {
        const ev2 = softenGate(ev, this.time, this.squad.count, this.squad.peak);
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
          kind: ev2.gate,
          lane: ev2.lane,
          value: ev2.value,
          weapon: ev2.weapon,
          label: ev2.label || "",
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
        if (this.bullets.spawn(src.x, src.z, damage, { heavy: this.squad.weapon === "heavy" })) any = true;
      }
      if (any) this.audio.play("shoot");
    }
    bulletCrosses(b, z, x, half = LANE_HALF) {
      if (Math.abs(b.x - x) > half) return false;
      if (b.pz <= z && b.z >= z) return true;
      return Math.abs(b.z - z) <= 0.8;
    }
    collideBullets() {
      const bullets = this.bullets.pool.active.slice();
      for (const b of bullets) {
        if (!b.alive || !this.bullets.pool.active.includes(b)) continue;
        for (const g of this.gates.ampGates()) {
          if (this.bulletCrosses(b, g.z, g.x)) b.amplified = true;
        }
        let consumed = false;
        const gateList = this.gates.pool.active.slice();
        for (const g of gateList) {
          if (!g.alive || g.kind === "amp" || g.stationary) continue;
          if (!this.bulletCrosses(b, g.z, g.x)) continue;
          chargeGate(g);
          this.particles.sparks(g.x, 1.2, g.z);
          this.bullets.pool.release(b);
          consumed = true;
          break;
        }
        if (consumed) continue;
        const propList = this.props.pool.active.slice();
        for (const p of propList) {
          if (!p.alive) continue;
          if (Math.abs(p.x - b.x) > p.radius + 0.55) continue;
          if (!this.bulletCrosses(b, p.z, p.x, p.radius + 0.7)) continue;
          const broke = this.props.hurt(p, b.damage);
          this.particles.sparks(p.x, 0.7, p.z);
          this.audio.play("hit");
          this.bullets.pool.release(b);
          consumed = true;
          if (broke) this.onPropOpened(p);
          break;
        }
        if (consumed) continue;
        const enemies = this.enemies.pool.active;
        let hitIndex = -1;
        let bestZ = Infinity;
        for (let j = 0; j < enemies.length; j++) {
          const e = enemies[j];
          if (e.airborne) continue;
          if (Math.abs(e.x - b.x) <= e.radius + 0.55 && Math.abs(e.z - b.z) <= 1.4) {
            if (e.z < bestZ) {
              bestZ = e.z;
              hitIndex = j;
            }
          }
        }
        if (hitIndex >= 0) {
          const e = enemies[hitIndex];
          this.particles.sparks(e.x, 0.6 + e.y, e.z);
          this.audio.play("hit");
          const dead = this.enemies.hurt(e, this.damageVs(b, e), { pierce: b.heavy });
          this.bullets.pool.release(b);
          if (dead) this.onEnemyKilled(e);
        }
      }
    }
    /** 已穿过金门的子弹 ×2；已走过金门、处在门与小队之间的敌人承伤 ×0.5 */
    damageVs(b, e) {
      let dmg = b.damage;
      if (b.amplified) dmg *= GOLD_AMP_MUL;
      for (const g of this.gates.ampGates()) {
        if (Math.abs(e.x - g.x) <= LANE_HALF + 1.2 && e.z < g.z) {
          dmg *= GOLD_NEAR_MUL;
          break;
        }
      }
      return dmg;
    }
    onEnemyKilled(e) {
      if (e.type === "splitter" && !e.isChild) {
        this.spawnSplitlings(e);
      }
      const color = enemyPuffColor(e.type);
      this.particles.puff(e.x, 0.4, e.z, color);
      this.kills += 1;
    }
    spawnSplitlings(e) {
      const lane = e.x < 0 ? "left" : "right";
      const offsets = [-0.75, 0.75];
      for (const off of offsets) {
        this.spawnEnemy("splitling", lane, {
          x: e.x + off,
          z: e.z + 0.15,
          isChild: true
        });
      }
    }
    onPropOpened(p) {
      if (p.kind === "cage") {
        this.squad.add(cageRewardAt(this.time, this.squad.peak));
        this.particles.puff(p.x, 0.6, p.z, "#E8D48A");
        this.audio.play("gate");
        this.props.pool.release(p);
        return;
      }
      this.explodeBarrel(p, false);
    }
    explodeBarrel(p, onSquad) {
      this.particles.burst(p.x, 0.6, p.z, "#E39A3A");
      this.audio.play("red");
      this.shake = Math.max(this.shake, 0.24);
      if (!onSquad) {
        const list = this.enemies.pool.active.slice();
        for (const e of list) {
          if (!e.alive) continue;
          const dx = e.x - p.x;
          const dz = e.z - p.z;
          if (dx * dx + dz * dz <= BARREL_AOE_RADIUS * BARREL_AOE_RADIUS) {
            const dead = this.enemies.hurt(e, BARREL_AOE_DAMAGE);
            if (dead) this.onEnemyKilled(e);
          }
        }
      }
      this.props.pool.release(p);
    }
    collideGates() {
      const list = this.gates.pool.active.slice();
      for (const g of list) {
        if (!g || !this.gates.pool.active.includes(g)) continue;
        if (g.kind === "amp" || g.stationary) continue;
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
        const id = g.weapon;
        this.squad.equip(id in { smg: 1, heavy: 1 } ? id : "pistol");
        this.audio.play("weapon");
      } else if (g.kind === "shield") {
        this.squad.grantShield(SHIELD_GATE_DURATION);
        this.audio.play("gate");
      }
    }
    collideProps() {
      const list = this.props.pool.active.slice();
      for (const p of list) {
        if (!p || !this.props.pool.active.includes(p)) continue;
        if (p.z > TEAM_Z + 0.8) continue;
        const near = Math.abs(p.x - this.squad.x) <= LANE_HALF + 0.35;
        if (p.z <= TEAM_Z + 0.8 && p.z >= TEAM_Z - 1.4 && near) {
          if (p.kind === "barrel") {
            this.explodeBarrel(p, true);
            if (this.squad.iframes <= 0) {
              this.squad.lose(BARREL_CONTACT_LOSS);
              this.shake = 0.28;
            }
          } else {
            this.particles.puff(p.x, 0.4, p.z, "#C9C0B0");
            this.props.pool.release(p);
          }
          if (this.squad.count <= 0) return;
        } else if (p.z <= TEAM_Z - 0.8) {
          this.props.pool.release(p);
        }
      }
    }
    collideEnemies() {
      if (this.squad.count <= 0) return;
      const list = this.enemies.pool.active.slice();
      for (const e of list) {
        if (!e || !this.enemies.pool.active.includes(e)) continue;
        if (e.z > TEAM_Z + 1.1) continue;
        const dx = Math.abs(e.x - this.squad.x);
        if (dx > LANE_X * 0.85) {
          if (e.z < TEAM_Z - 0.6) {
          }
          continue;
        }
        if (e.z <= TEAM_Z + 1.1 && e.z >= TEAM_Z - 1.4) {
          const loss = ENEMY[e.type].contactLoss;
          const color = enemyPuffColor(e.type);
          if (this.squad.iframes > 0) {
            this.particles.puff(e.x, 0.4, e.z, color);
            this.enemies.pool.release(e);
            continue;
          }
          this.squad.lose(loss);
          this.shake = 0.28;
          this.particles.puff(e.x, 0.4, e.z, color);
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
        else if (hit === "legal") {
          this.legalPage = "summary";
          this.legalScroll = 0;
          this.state = "legal";
        }
        return;
      }
      if (this.state === "legal") {
        const hit = legalHit(x, y, this.legalPage);
        if (hit === "back") {
          if (this.legalPage === "summary") this.state = "title";
          else {
            this.legalPage = "summary";
            this.legalScroll = 0;
          }
        } else if (hit === "privacy" || hit === "age") {
          this.legalPage = hit;
          this.legalScroll = 0;
        }
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
      drawWorld(ctx, camX, this.animTime, sh, sv, this.scene, this.namedKind === "hold" || this.holdStarted && this.time < this.holdUntil);
      const items = [];
      if (this.warningLane && this.state === "playing") {
        items.push({
          z: 28,
          draw: () => drawLaneWarning(ctx, this.warningLane, camX, this.warningImpactAt - this.time)
        });
      } else if (this.rushActive && this.state === "playing") {
        items.push({
          z: 28,
          draw: () => drawLaneWarning(ctx, "left", camX, this.rushSpawnAt - this.time, "rush")
        });
      } else if (this.namedKind === "pincer" && this.state === "playing") {
        items.push({
          z: 28,
          draw: () => {
            drawLaneWarning(ctx, "left", camX, this.namedSpawnAt - this.time, "rush");
            drawLaneWarning(ctx, "right", camX, this.namedSpawnAt - this.time, "warn");
          }
        });
      } else if (this.namedKind === "alley" && this.state === "playing") {
        items.push({
          z: 28,
          draw: () => {
            const side = this.alleyFacing;
            if (side === "left" || side === "both") drawLaneWarning(ctx, "left", camX, this.namedSpawnAt - this.time, "alley");
            if (side === "right" || side === "both") drawLaneWarning(ctx, "right", camX, this.namedSpawnAt - this.time, "alley");
          }
        });
      } else if (this.namedKind === "hold" && this.state === "playing") {
        items.push({
          z: 26,
          draw: () => drawLaneWarning(ctx, "mid", camX, this.namedSpawnAt - this.time, "hold")
        });
      }
      for (const g of this.gates.pool.active) {
        items.push({ z: g.z, draw: () => drawGate(ctx, g, camX) });
      }
      for (const p of this.props.pool.active) {
        items.push({ z: p.z, draw: () => drawProp(ctx, p, camX) });
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
          weapon: this.squad.weapon,
          weaponTime: this.squad.weaponTime,
          remain: this.time,
          fireBonus: this.squad.fireBonus,
          muted: this.audio.muted,
          hint: this.hint,
          kills: this.kills,
          shieldTime: this.squad.shieldTime,
          warning: this.warningLane ? { lane: this.warningLane, timeLeft: Math.max(0, this.warningImpactAt - this.time) } : null,
          rush: this.rushActive ? { timeLeft: Math.max(0, this.rushSpawnAt - this.time), spawned: this.rushSpawned } : null,
          banner: this.currentBanner()
        });
      } else if (this.state === "title") {
        drawTitle(ctx, this.best, this.audio.muted);
      } else if (this.state === "legal") {
        drawLegal(ctx, this.legalPage, this.legalScroll);
      } else {
        drawResult(ctx, this.kills, this.time, this.squad.peak, this.best);
      }
    }
  };
  function enemyPuffColor(type) {
    if (type === "sprinter" || type === "jumper") return "#7BA24A";
    if (type === "bomber") return "#E39A3A";
    if (type === "shield") return "#C4A574";
    if (type === "splitter" || type === "splitling") return "#8FBF88";
    return "#A8D9B8";
  }

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
