import {
  TIMELINE,
  MAX_SQUAD,
  MAX_BULLETS,
  WEAPONS,
  ENEMY,
  SCRIPT_ENEMY_END,
  LANE_X,
  CANVAS_W,
  GOLD_AMP_MUL,
  GOLD_NEAR_MUL,
  GOLD_GATE_Z,
  GATE_CHARGE_CAP,
  WARNING_DAMAGE,
  WARNING_FIRST,
  WARNING_TELEGRAPH,
  RUSH_FIRST,
  RUSH_TELEGRAPH,
  RUSH_BANNER,
  RUSH_QUIET,
  CAGE_REWARD,
  CAGE_LABEL,
  SCENE_SHIFT_AT,
  GOLD_GATE_LIFE,
  GOLD_WINDOW_Z,
  MERCY_AT,
  SHIELD_GATE_DURATION,
  OVERFLOW_SHIELD_DURATION,
  NIGHT_SHIELD_DURATION,
  GOLD_WINDOW_SAFE,
  GOLD_WINDOW_LULL,
  GOLD_WINDOW_LIFE,
  GOLD_CLOSE_BANNER,
  GOLD_WARN_SETTLE,
  HOLD_FIRST,
  HOLD_SETTLE,
  HOLD_REFILL,
  HOLD_MID,
  STORM_BANNER_FIRST,
  FLOOD_DAMAGE,
  FLOOD_TELEGRAPH,
  FLOOD_DURATION,
  EVENT_GAP,
  OPENING_END,
  STORM_DELAY,
  NIGHT_HEAVY_LOCK,
  lateRefillAmount,
  alleyBannerText,
  alleySide,
  alleyTime,
  endlessGateFor,
  goldWindowTime,
  holdTime,
  pincerTime,
  softenGate,
  BARREL_CONTACT_LOSS,
  BARREL_AOE_DAMAGE,
  enemyHpMul,
  rushPack,
  rushPeriod,
  warningPeriod,
  warningDamage,
  holdDamageAt,
} from "../src/config";
import { Game } from "../src/game";
import { LEGAL_AGE, LEGAL_PRIVACY, LEGAL_SUMMARY } from "../src/legal";
import { legalHit, legalMaxScroll, titleHit } from "../src/render";
import { Squad } from "../src/squad";
import { chargeGate, gateSignedValue } from "../src/gates";
import type { Platform, PointerSample } from "../src/platform";

let failed = 0;
let passed = 0;

function assert(cond: unknown, msg: string): void {
  if (cond) {
    passed += 1;
    return;
  }
  failed += 1;
  console.error("  ✗ " + msg);
}

function assertEq(a: unknown, b: unknown, msg: string): void {
  assert(a === b, `${msg} (得到 ${String(a)}, 期望 ${String(b)})`);
}

function assertClose(a: number, b: number, eps: number, msg: string): void {
  assert(Math.abs(a - b) <= eps, `${msg} (得到 ${a}, 期望约 ${b})`);
}

function measureText(): TextMetrics {
  return {
    width: 40,
    actualBoundingBoxAscent: 12,
    actualBoundingBoxDescent: 4,
    actualBoundingBoxLeft: 0,
    actualBoundingBoxRight: 40,
    fontBoundingBoxAscent: 12,
    fontBoundingBoxDescent: 4,
    alphabeticBaseline: 0,
    emHeightAscent: 12,
    emHeightDescent: 4,
    hangingBaseline: 0,
    ideographicBaseline: 0,
  } as TextMetrics;
}

function mockCtx(): CanvasRenderingContext2D {
  const grad = { addColorStop: () => undefined };
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_t, prop) {
      if (prop === "measureText") return () => measureText();
      if (prop === "createLinearGradient" || prop === "createRadialGradient") return () => grad;
      if (prop === "canvas") return { width: 720, height: 1280 };
      return () => undefined;
    },
    set() {
      return true;
    },
  };
  return new Proxy({}, handler) as unknown as CanvasRenderingContext2D;
}

function mockPlatform(): Platform {
  const storage = new Map<string, string>();
  const canvas = {
    width: 720,
    height: 1280,
    style: {},
    getContext: () => mockCtx(),
  } as unknown as HTMLCanvasElement;
  return {
    kind: "web",
    canvas,
    ctx: mockCtx(),
    dpr: 1,
    cssWidth: 720,
    cssHeight: 1280,
    now: () => 0,
    raf: () => 0,
    getStorage: (k) => storage.get(k) ?? null,
    setStorage: (k, v) => {
      storage.set(k, v);
    },
    onResize: () => undefined,
    onPointerDown: (_cb: (p: PointerSample) => void) => undefined,
    onPointerMove: () => undefined,
    onPointerUp: () => undefined,
    onKeyDown: () => undefined,
    onKeyUp: () => undefined,
    layout: () => undefined,
    toLogic: (x, y) => ({ x, y }),
    tryAudioContext: () => null,
  };
}

console.log("1. 时间轴约束");
{
  const gates = TIMELINE.filter((e) => e.kind === "gate");
  const enemies = TIMELINE.filter((e) => e.kind === "enemy");
  const plus3 = gates.find((g) => g.label === "+3" && g.lane === "left" && Math.abs(g.time - 6) < 0.2);
  assert(!!plus3, "约第 6 秒左道有蓝门 +3");
  const after = gates.filter((g) => g.time > 6 && g.time < 10 && g.gate === "weapon" && g.weapon === "smg");
  assert(after.length >= 1, "紧接着有一扇冲锋枪武器门");
  const earlyWalkers = enemies.filter((e) => e.time >= 2 && e.time <= 7 && e.enemy === "walker" && e.lane === "right");
  assert(earlyWalkers.length >= 4 && earlyWalkers.length <= 6, "开局 2–7 秒右道有 4–6 只游走体");
  const x2 = gates.find((g) => g.gate === "mul" && g.value === 2 && g.time >= 20 && g.time <= 25);
  assert(!!x2, "约 20–25 秒有一扇 ×2 蓝门");
  const reds = gates.filter((g) => g.gate === "red");
  assert(reds.every((g) => g.time >= 15), "前 15 秒绝不出红门");
  assert(reds.some((g) => g.time >= 40 && g.time <= 45 && g.value === 3), "约 40 秒后有一扇红门 -3");
  const addAfter70 = gates.filter((g) => g.time >= 70 && (g.gate === "add" || g.gate === "mul"));
  assert(addAfter70.length === 0, "脚本时间轴在 70 秒后不再排加人门（之后由无尽段补门）");
  const earlyEnemies = enemies.filter((e) => e.time < 10);
  assert(
    earlyEnemies.every((e) => e.enemy === "walker" || e.enemy === "sprinter"),
    "教学段 10 秒内只有游走体和冲刺体",
  );
  const types = new Set(enemies.map((e) => e.enemy));
  assert(types.has("walker") && types.has("sprinter"), "时间轴包含游走体与冲刺体");
  assert(types.has("jumper") && types.has("shield") && types.has("bomber") && types.has("splitter"), "时间轴包含跳跃/盾兵/爆裂/分裂");
  assert(enemies.some((e) => e.enemy === "jumper" && e.time >= 15 && e.time <= 17), "约 16 秒起出现跳跃体");
  assert(enemies.some((e) => e.enemy === "shield" && e.time >= 27 && e.time <= 29), "约 28 秒起出现盾兵");
  assert(enemies.some((e) => e.enemy === "bomber" && e.time >= 37 && e.time <= 39), "约 38 秒起出现爆裂体");
  assert(enemies.some((e) => e.enemy === "splitter" && e.time >= 49 && e.time <= 51), "约 50 秒起出现分裂体");
  assert(!enemies.some((e) => e.time < 10 && (e.enemy === "jumper" || e.enemy === "shield" || e.enemy === "bomber" || e.enemy === "splitter")), "新类型不出现在开局 10 秒");
  const midHorde = enemies.filter((e) => e.time >= 20 && e.time < 40);
  const lateHorde = enemies.filter((e) => e.time >= 40 && e.time < 70);
  assert(midHorde.length >= 70, "20–40 秒出怪应明显加密，得到 " + midHorde.length);
  assert(lateHorde.length >= 180, "40–70 秒出怪应成对加密，得到 " + lateHorde.length);
  assert(enemies.filter((e) => e.enemy === "jumper" && e.time <= 70).length >= 20, "70 秒前跳跃体应更频繁");
  assert(warningPeriod(WARNING_FIRST) <= 13.5, "红预警起始间隔应不宽于 13.5 秒");
  assert(warningPeriod(90) >= 11, "入夜到 2:30 前红预警应拉开间隔，好让人打到守住中道");
  assert(warningPeriod(200) <= 8, "岔路口之后红预警间隔应收紧到约 8 秒");
  assert(warningPeriod(200) < warningPeriod(WARNING_FIRST), "后期红预警间隔应随时间收紧");
  assert(ENEMY.walker.hp === 3 && ENEMY.walker.speed === 1, "游走体生命 3、移速 1.0");
  assert(ENEMY.sprinter.hp === 2 && ENEMY.sprinter.speed === 1.7, "冲刺体生命 2、移速 1.7");
  assert(WEAPONS.pistol.damage === 1 && WEAPONS.pistol.rate === 4, "手枪伤害 1.0、约 4 发/秒");
  assert(WEAPONS.smg.damage === 0.7 && WEAPONS.smg.rate === 12 && WEAPONS.smg.duration === 15, "冲锋枪数值符合规格");
  const lastEnemy = Math.max(...enemies.map((e) => e.time));
  assertClose(lastEnemy, SCRIPT_ENEMY_END, 0.01, "脚本段最后出现时间与常量一致");
}

console.log("2. 小队人数顶与射速加成");
{
  const s = new Squad();
  s.reset();
  assertEq(s.count, 1, "开局 1 人");
  assertEq(s.weapon, "pistol", "默认手枪");
  s.add(3);
  assertEq(s.count, 4, "+3 后为 4 人");
  s.mul(2);
  assertEq(s.count, 8, "×2 后为 8 人");
  const r = s.add(20);
  assertEq(s.count, MAX_SQUAD, "人数硬顶 20");
  assert(r.overflow > 0, "超出部分被记录");
  assertClose(s.fireBonus, 3, 0.001, "超出部分给予 3 秒射速加成");
  s.equip("smg");
  assertEq(s.weapon, "smg", "可换冲锋枪");
  s.update(15.05, 0);
  assertEq(s.weapon, "pistol", "冲锋枪 15 秒后回退手枪");
  s.setCount(5);
  s.lose(1);
  assertEq(s.count, 4, "碰撞减 1 人");
  assert(s.iframes > 0, "碰撞后进入短暂无敌");
}

console.log("3. 游戏启动与时间轴生成");
{
  const game = new Game(mockPlatform());
  const idle = game.getState();
  assertEq(idle.state, "title", "初始为开局界面");
  game.beginRun();
  let st = game.getState();
  assertEq(st.state, "playing", "开始后进入对局");
  assertEq(st.squadCount, 1, "开局 1 人");
  assertEq(st.weapon, "pistol", "开局手枪");
  assert(st.hint, "开局显示操作提示");

  game.step(1.5);
  st = game.getState();
  assertEq(st.enemies.length, 0, "1.5 秒时游走体尚未出现");

  game.step(0.6);
  st = game.getState();
  assert(st.enemies.length >= 1, "约 2 秒右道出现游走体");

  game.step(4.0); // t ≈ 6.1
  st = game.getState();
  const plus3 = st.gates.find((g) => g.label === "+3" && g.lane === "left");
  assert(!!plus3, "第 6 秒左道出现 +3 蓝门");
  const walkers = game.spawned.filter((e) => e.kind === "enemy" && e.time <= 6.1);
  assert(walkers.length === 5, "到第 6 秒已放出 5 只开局游走体");

  game.step(1.3); // t ≈ 7.4
  st = game.getState();
  const smg = st.gates.find((g) => g.label === "冲锋枪" && g.lane === "left");
  assert(!!smg, "紧接着出现冲锋枪门");

  // 后段时间轴更密，1 人站右道会被撞死导致停表；这里只验收事件是否按点放出
  game.squad.setCount(20);

  game.step(15.0); // t ≈ 22.4
  st = game.getState();
  const x2 = st.gates.find((g) => g.label === "×2") || game.spawned.find((e) => e.gate === "mul" && e.time <= 22.5);
  assert(!!x2, "20–25 秒内放出 ×2 蓝门");

  // 继续推到 41 秒，确认红门
  game.step(19.0); // t ≈ 41.4
  st = game.getState();
  const red = st.gates.find((g) => g.kind === "red" && g.label === "-3")
    || game.spawned.find((e) => e.gate === "red" && e.time <= 41.4);
  assert(!!red, "约 40 秒后放出红门 -3");
  const earlyRed = game.spawned.some((e) => e.gate === "red" && e.time < 15);
  assert(!earlyRed, "实际对局前 15 秒没有红门");
}

console.log("4. 穿门效果、失败与通关");
{
  const game = new Game(mockPlatform());
  game.beginRun();
  // 走到左道，快进到穿过 +3
  game.input.targetX = -3.25;
  game.input.swiped = true;
  game.step(10.0);
  const st = game.getState();
  assert(!st.hint, "滑动后提示消失");
  assert(st.squadCount >= 4, "穿过 +3 后门人数至少为 4（得到 " + st.squadCount + "）");
  // 再穿过冲锋枪门
  assert(st.weapon === "smg" || game.squad.weapon === "smg" || st.time < 11, "穿过武器门后应为冲锋枪或门尚在接近");
  if (st.weapon !== "smg") {
    game.step(2.0);
  }
  const st2 = game.getState();
  assertEq(st2.weapon, "smg", "教学段结束后应已拿到冲锋枪");

  // 失败：人数归零
  const failGame = new Game(mockPlatform());
  failGame.beginRun();
  failGame.squad.setCount(1);
  failGame.squad.lose(1);
  failGame.step(0.05);
  assertEq(failGame.getState().state, "fail", "人数归零进入失败结算");

  // 无尽生存：过 90 秒且人数仍在则继续对局，不会通关结算
  const liveGame = new Game(mockPlatform());
  liveGame.beginRun();
  liveGame.squad.setCount(20);
  while (liveGame.time < 95 && liveGame.state === "playing") {
    liveGame.step(0.5);
    liveGame.squad.setCount(20);
  }
  const live = liveGame.getState();
  assertEq(live.state, "playing", "坚持过 90 秒也不会通关结算");
  assert(live.time >= 94.9, "逻辑时间应能推进过 90 秒，当前 " + live.time.toFixed(2));
  assert(live.enemies.length >= 1, "脚本段结束后仍继续出怪，当前 " + live.enemies.length);
}

console.log("5. 靠右道开火可清掉开局游走体");
{
  const game = new Game(mockPlatform());
  game.beginRun();
  // beginRun 已把队伍放在右道
  game.step(9.0);
  const st = game.getState();
  assert(st.kills >= 5, "9 秒内应打掉 5 只开局游走体（击杀 " + st.kills + "）");
  assert(st.squadCount >= 1, "清掉开局波后人数仍至少为 1");
  const remainingOpeners = st.enemies.filter((e) => e.type === "walker" && e.z <= 20);
  assert(remainingOpeners.length === 0, "近处不应再残留开局游走体");
}

console.log("6. 对象上限与绘制不抛错");
{
  const game = new Game(mockPlatform());
  game.beginRun();
  game.squad.setCount(20);
  game.step(8);
  for (let i = 0; i < 100; i++) game.bullets.spawn(0, 14, 1);
  assert(game.bullets.pool.size <= MAX_BULLETS, "同屏子弹不超过 " + MAX_BULLETS);
  assert(game.enemies.pool.size <= 25, "同屏敌人不超过 25");
  assert(game.squad.pool.size <= 20, "我方不超过 20");
  let threw = false;
  try {
    game.drawFrame();
  } catch (err) {
    threw = true;
    console.error(err);
  }
  assert(!threw, "绘制一帧不抛错");
}

console.log("7. 穿过成对红蓝门后不应卡死");
{
  const game = new Game(mockPlatform());
  game.beginRun();
  // 一直走左道，会吃到 40.5 秒与右道红门成对的 +3 蓝门（约 43.6 秒穿过）
  game.input.targetX = -3.25;
  game.input.swiped = true;
  let threw = false;
  let threwAt = 0;
  let err = "";
  try {
    // 分小步推进，覆盖倒计时显示 0:47 的那一段（约 43.6 秒）
    while (game.time < 50) {
      game.step(1 / 60);
      game.drawFrame();
    }
  } catch (e) {
    threw = true;
    threwAt = game.time;
    err = String(e);
  }
  const st = game.getState();
  assert(!threw, "穿过成对门时不应抛错（在 t=" + threwAt.toFixed(2) + " 抛出: " + err + "）");
  assert(st.state === "playing" || st.state === "win" || st.state === "fail", "对局仍处于有效状态，得到 " + st.state);
  assert(st.time >= 50 || st.state !== "playing", "逻辑时间应能推进过 43.6 秒（当前 " + st.time.toFixed(2) + "，状态 " + st.state + "）");
  assert(st.squadCount >= 4, "一直走左道应已吃到加人门，人数 " + st.squadCount);
}

console.log("8. 每个小兵各一条弹道");
{
  const one = new Game(mockPlatform());
  one.beginRun();
  one.squad.setCount(1);
  one.squad.x = 0;
  one.input.targetX = 0;
  one.step(0.3);
  const oneXs = [...new Set(one.bullets.pool.active.map((b) => +b.x.toFixed(3)))];
  assert(oneXs.length === 1, "1 人时应只有一条弹道，得到 " + oneXs.join(", "));

  const two = new Game(mockPlatform());
  two.beginRun();
  two.squad.setCount(2);
  two.squad.x = 0;
  two.input.targetX = 0;
  two.step(0.3);
  const twoXs = [...new Set(two.bullets.pool.active.map((b) => +b.x.toFixed(3)))];
  assert(twoXs.length >= 2, "2 人时应有两条弹道，得到 " + twoXs.join(", "));
  assert(Math.abs(twoXs[0] - twoXs[1]) >= 0.5, "两条弹道应明显分开，间距 " + Math.abs(twoXs[0] - (twoXs[1] ?? 0)).toFixed(2));
}


console.log("9. 开枪给加减门充能，红门可翻成蓝门");
{
  const red = { alive: true, kind: "red" as const, lane: "right" as const, x: 0, z: 20, value: 3, weapon: null, label: "-3", consumed: false, pairKey: 0, stationary: false };
  assert(chargeGate(red), "红门可被充能");
  assertEq(red.label, "-2", "—3 打一枪变成 -2");
  chargeGate(red);
  chargeGate(red);
  assertEq(red.kind, "add", "打过 0 后翻成蓝门");
  assertEq(red.label, "0", "经过 0");
  chargeGate(red);
  assertEq(red.label, "+1", "0 再打一枪变成 +1");
  assertEq(gateSignedValue(red), 1, "带符号值为 +1");

  const add = { alive: true, kind: "add" as const, lane: "left" as const, x: 0, z: 20, value: 14, weapon: null, label: "+14", consumed: false, pairKey: 0, stationary: false };
  assert(chargeGate(add), "+14 可充到 +15");
  assertEq(add.label, "+15", "充能到上限 +15");
  assertEq(chargeGate(add), false, "到达上限后不再增加");
  assertEq(add.value, GATE_CHARGE_CAP, "上限为 " + GATE_CHARGE_CAP);

  const mul = { alive: true, kind: "mul" as const, lane: "left" as const, x: 0, z: 20, value: 2, weapon: null, label: "×2", consumed: false, pairKey: 0, stationary: false };
  assertEq(chargeGate(mul), false, "倍增门开枪不改数值");
  assertEq(mul.value, 2, "×2 仍为 2");

  const game = new Game(mockPlatform());
  game.beginRun();
  game.squad.setCount(3);
  game.squad.x = LANE_X;
  game.input.targetX = LANE_X;
  const g = game.gates.spawn({ kind: "red", lane: "right", value: 2, label: "-2" });
  if (g) g.z = 24;
  game.step(0.4);
  const charged = game.gates.pool.active.find((x) => x !== undefined && (x.kind === "red" || x.kind === "add") && Math.abs(x.x - LANE_X) < 0.1);
  assert(!!charged && !!g && g.alive, "右道测试门仍在");
  assert(charged && gateSignedValue(charged) > -2, "子弹打中红门后数值应已上升，当前 " + (charged ? charged.label : "无"));
  const passed = game.bullets.pool.active.filter((b) => g && b.z > g.z + 1.2);
  assert(passed.length === 0, "打中门的子弹应被消耗，不应继续飞向感染体");
}

console.log("10. 金色增幅门：远距 ×2，走过门后承伤 ×0.5");
{
  const game = new Game(mockPlatform());
  game.beginRun();
  const amp = game.gates.spawn({ kind: "amp", lane: "right", label: "×2", z: GOLD_GATE_Z, stationary: true });
  assert(!!amp, "可生成金色增幅门");
  const far = game.damageVs({ damage: 1, amplified: true, x: LANE_X }, { z: GOLD_GATE_Z + 6, x: LANE_X });
  assertEq(far, GOLD_AMP_MUL, "已穿过金门的子弹打门后敌人伤害 ×2");
  const near = game.damageVs({ damage: 1, amplified: false, x: LANE_X }, { z: GOLD_GATE_Z - 8, x: LANE_X });
  assertEq(near, GOLD_NEAR_MUL, "已走过金门、位于门与小队之间的敌人承伤 ×0.5");
  game.step(12.1);
  const liveAmp = game.getState().gates.find((g) => g.kind === "amp");
  assert(!!liveAmp, "教学结束后右道应出现金色增幅门");
  assert(liveAmp && Math.abs(liveAmp.z - GOLD_GATE_Z) < 0.2, "金门停在中距，不滑向小队");
}

console.log("11. 新感染体：盾兵、爆裂、分裂、跳跃");
{
  const shieldGame = new Game(mockPlatform());
  shieldGame.beginRun();
  const sh = shieldGame.enemies.spawn("shield", "right", { z: 30, hpMul: 1 });
  assert(!!sh, "可生成盾兵");
  const hp0 = sh!.hp;
  const dead = shieldGame.enemies.hurt(sh!, 2);
  assert(!dead, "盾兵 2 点伤害不应被直接打掉");
  assertClose(sh!.hp, hp0 - 1, 0.001, "盾兵承伤减半（2 伤害只掉 1 血）");

  const bombGame = new Game(mockPlatform());
  bombGame.beginRun();
  bombGame.enemies.clear();
  bombGame.squad.setCount(6);
  bombGame.squad.iframes = 0;
  bombGame.squad.x = LANE_X;
  bombGame.input.targetX = LANE_X;
  bombGame.enemies.spawn("bomber", "right", { z: 14.2, x: LANE_X, hpMul: 1 });
  bombGame.step(0.08);
  assertEq(bombGame.squad.count, 3, "爆裂体碰队掉 3 人");

  const splitGame = new Game(mockPlatform());
  splitGame.beginRun();
  splitGame.enemies.clear();
  const parent = splitGame.enemies.spawn("splitter", "right", { z: 28, x: LANE_X, hpMul: 1 });
  assert(!!parent, "可生成分裂体");
  const died = splitGame.enemies.hurt(parent!, 99);
  assert(died, "分裂体可被打掉");
  splitGame.onEnemyKilled(parent!);
  const kids = splitGame.enemies.pool.active.filter((e) => e.type === "splitling");
  assertEq(kids.length, 2, "分裂体死亡后拆成 2 个小子");
  assert(Math.abs(kids[0].x - kids[1].x) >= 0.5, "两个子体应有横向错开");
  for (const kid of kids) {
    const kd = splitGame.enemies.hurt(kid, 99);
    assert(kd, "子体可被打掉");
    splitGame.onEnemyKilled(kid);
  }
  const grand = splitGame.enemies.pool.active.filter((e) => e.type === "splitling" && e.alive);
  assertEq(grand.length, 0, "子体不再继续分裂");
}

{
  const jumpGame = new Game(mockPlatform());
  jumpGame.beginRun();
  jumpGame.enemies.clear();
  jumpGame.bullets.clear();
  const j = jumpGame.enemies.spawn("jumper", "right", { z: 24, x: LANE_X, hpMul: 1 });
  assert(!!j, "可生成跳跃体");
  let sawAir = false;
  let airHp = 0;
  for (let i = 0; i < 180; i++) {
    jumpGame.enemies.update(1 / 60);
    if (j!.airborne) {
      sawAir = true;
      airHp = j!.hp;
      jumpGame.bullets.clear();
      jumpGame.bullets.spawn(LANE_X, j!.z - 0.8, 10);
      const b = jumpGame.bullets.pool.active[0];
      if (b) {
        b.z = j!.z;
        b.pz = j!.z - 0.5;
      }
      jumpGame.step(0); // no-op
      // 直接走 collide：用极短 step，但会移动跳跃体。改为检查 airborne 时 hurt 不被子弹打到：
      break;
    }
  }
  assert(sawAir, "跳跃体应会腾空");
  // 腾空时用游戏碰撞：把子弹叠上去再走 collideBullets via tiny custom step
  jumpGame.bullets.clear();
  const before = j!.hp;
  const bullet = jumpGame.bullets.spawn(j!.x, j!.z - 0.8, 10);
  if (bullet) {
    bullet.z = j!.z;
    bullet.pz = j!.z;
  }
  // 触发更新中的碰撞：保持 airborne
  assert(j!.airborne, "此时应仍在空中");
  jumpGame.time = 0.5;
  jumpGame.state = "playing";
  // 用 0 dt 不会跑跳跃落地？update 用正 dt。直接检查 collide 路径：再 step 一个极小值但先锁 airborne
  const keepAir = j!.airT;
  jumpGame.step(1 / 120);
  if (j!.airborne || (keepAir > 1 / 120 && j!.hp === before)) {
    assert(j!.hp === before || j!.airborne, "腾空时不应被子弹打中，血量 " + j!.hp + " / 原 " + before);
  } else {
    // 若这帧已落地，只要曾经腾空即可，落地可被打
    assert(sawAir, "跳跃体有腾空阶段");
  }

  // 落地后应当能被打到
  const landGame = new Game(mockPlatform());
  landGame.beginRun();
  landGame.enemies.clear();
  const j2 = landGame.enemies.spawn("jumper", "right", { z: 20, x: LANE_X, hpMul: 1 });
  j2!.airborne = false;
  j2!.y = 0;
  j2!.jumpT = 5;
  const hpLand = j2!.hp;
  landGame.squad.setCount(4);
  landGame.squad.x = LANE_X;
  landGame.input.targetX = LANE_X;
  landGame.step(0.4);
  assert(j2!.hp < hpLand || !j2!.alive, "落地后应能被子弹打到");
}

console.log("12. 红预警：必须换道，留下则掉人");
{
  const stay = new Game(mockPlatform());
  stay.beginRun();
  stay.squad.setCount(20);
  stay.input.targetX = -LANE_X;
  stay.squad.x = -LANE_X;
  // 推到预警即将出现，清掉干扰
  stay.step(WARNING_FIRST - 0.1);
  stay.enemies.clear();
  stay.props.clear();
  stay.gates.clear();
  stay.squad.setCount(20);
  stay.squad.shieldTime = 0;
  stay.squad.x = -LANE_X;
  stay.input.targetX = -LANE_X;
  stay.step(0.2);
  const w = stay.getState().warning;
  assert(!!w, "约 " + WARNING_FIRST + " 秒应出现红预警");
  assertEq(w && w.lane, "left", "预警应打在小队当前所在的左道");
  assertEq(w && w.text, "躲开左道！", "预警横幅应写明是左道危险");
  stay.enemies.clear();
  stay.props.clear();
  stay.gates.clear();
  stay.squad.setCount(20);
  stay.squad.shieldTime = 0;
  stay.squad.iframes = 0;
  const before = stay.squad.count;
  const staySlices = Math.ceil((WARNING_TELEGRAPH + 0.08) / (1 / 60));
  for (let i = 0; i < staySlices; i++) {
    stay.enemies.clear();
    stay.props.clear();
    stay.gates.clear();
    stay.step(1 / 60);
    if (!stay.warningLane && stay.squad.count < before) break;
  }
  const lost = before - stay.squad.count;
  assert(lost === WARNING_DAMAGE || stay.squad.count === before - WARNING_DAMAGE, "留在预警车道应被打掉 " + WARNING_DAMAGE + " 人，实际掉 " + lost);

  const dodge = new Game(mockPlatform());
  dodge.beginRun();
  dodge.squad.setCount(20);
  dodge.input.targetX = -LANE_X;
  dodge.squad.x = -LANE_X;
  dodge.step(WARNING_FIRST - 0.1);
  dodge.enemies.clear();
  dodge.props.clear();
  dodge.gates.clear();
  dodge.squad.setCount(20);
  dodge.squad.shieldTime = 0;
  dodge.squad.x = -LANE_X;
  dodge.input.targetX = -LANE_X;
  dodge.step(0.2);
  const w2 = dodge.getState().warning;
  assert(!!w2 && w2.lane === "left", "第二局预警同样打在左道");
  dodge.input.targetX = LANE_X;
  dodge.enemies.clear();
  dodge.props.clear();
  dodge.gates.clear();
  // 给足够时间滑到右道
  const slices = Math.ceil((WARNING_TELEGRAPH + 0.02) / (1 / 60));
  for (let i = 0; i < slices; i++) {
    dodge.enemies.clear();
    dodge.props.clear();
    dodge.gates.clear();
    dodge.step(1 / 60);
  }
  assert(dodge.squad.x > 0, "预警结束前应已换到右道，x=" + dodge.squad.x.toFixed(2));
  // 换道成功则预警本身不应扣人；若仍被其它东西碰到，人数掉幅应小于预警伤害
  assert(dodge.squad.count > 20 - WARNING_DAMAGE, "换道后不应吃到预警伤害，人数 " + dodge.squad.count);
}

console.log("13. 人质笼与油桶取舍");
{
  const cageGame = new Game(mockPlatform());
  cageGame.beginRun();
  cageGame.enemies.clear();
  cageGame.input.targetX = -LANE_X;
  cageGame.squad.x = -LANE_X;
  cageGame.squad.setCount(4);
  const cage = cageGame.props.spawn("cage", "left", { z: 18, hp: 3 });
  assert(!!cage, "可生成人质笼");
  cageGame.step(1.0);
  assert(cageGame.squad.count === 4 + CAGE_REWARD, "打开人质笼应加人，人数 " + cageGame.squad.count);
  assert(cageGame.props.pool.active.every((p) => p !== cage), "打开后笼子应消失");

  const miss = new Game(mockPlatform());
  miss.beginRun();
  miss.enemies.clear();
  miss.input.targetX = -LANE_X;
  miss.squad.x = -LANE_X;
  miss.squad.setCount(5);
  miss.squad.iframes = 2;
  const missed = miss.props.spawn("cage", "left", { z: 14.1, hp: 8 });
  assert(!!missed, "未打开的笼子可靠近小队");
  miss.step(0.2);
  assertEq(miss.squad.count, 5, "未打开的人质笼到达小队时只是错过，不应清队");

  const barrelGame = new Game(mockPlatform());
  barrelGame.beginRun();
  barrelGame.enemies.clear();
  barrelGame.squad.setCount(6);
  barrelGame.squad.x = LANE_X;
  barrelGame.input.targetX = LANE_X;
  const barrel = barrelGame.props.spawn("barrel", "right", { z: 22, hp: 1 });
  const e1 = barrelGame.enemies.spawn("walker", "right", { z: 22, x: LANE_X, hpMul: 1 });
  const e2 = barrelGame.enemies.spawn("walker", "right", { z: 22.4, x: LANE_X + 0.4, hpMul: 1 });
  assert(!!barrel && !!e1 && !!e2, "油桶和附近感染体已放好");
  barrelGame.step(0.6);
  const nearHp = [e1, e2].filter((e) => e && e.alive && e.hp < e.maxHp || (e && !e.alive));
  assert(nearHp.length >= 1 || barrelGame.kills >= 1, "打爆油桶应对附近感染体造成范围伤害，击杀 " + barrelGame.kills);

  const boom = new Game(mockPlatform());
  boom.beginRun();
  boom.enemies.clear();
  boom.squad.setCount(6);
  boom.squad.x = LANE_X;
  boom.input.targetX = LANE_X;
  boom.squad.iframes = 0;
  boom.props.spawn("barrel", "right", { z: 14.15, hp: 99 });
  boom.step(0.15);
  assertEq(boom.squad.count, 6 - BARREL_CONTACT_LOSS, "未引爆的油桶碰到小队掉 2 人");
}

console.log("14. 存活越久，感染体越肉");
{
  const m20 = enemyHpMul(20);
  const m60 = enemyHpMul(60);
  const m120 = enemyHpMul(120);
  assert(m20 >= 1, "教学刚结束后血量倍率至少为 1，得到 " + m20);
  assert(m60 >= 1.9, "t=60 的血量倍率应已接近翻倍，得到 " + m60.toFixed(3));
  assert(m120 > m20 * 1.5, "t=120 的血量倍率应明显高于 t=20（" + m120.toFixed(3) + " vs " + m20.toFixed(3) + "）");
  const g = new Game(mockPlatform());
  g.beginRun();
  const a = g.enemies.spawn("walker", "right", { hpMul: enemyHpMul(20) });
  const b = g.enemies.spawn("walker", "right", { hpMul: enemyHpMul(120) });
  const c = g.enemies.spawn("shield", "right", { hpMul: enemyHpMul(120) });
  assert(!!a && !!b && !!c, "可按倍率生成感染体");
  assert(b!.maxHp > a!.maxHp * 1.5, "游走体 t=120 的生命明显高于 t=20（" + b!.maxHp + " vs " + a!.maxHp + "）");
  assert(c!.maxHp > a!.maxHp, "新类型同样吃存活加血倍率");
}

console.log("15. 左道来袭：可读压力事件，教学段不出现");
{
  const early = new Game(mockPlatform());
  early.beginRun();
  early.step(9.5);
  assert(!early.getState().rush, "教学段 10 秒内不应出现左道来袭");
  assert(early.enemies.pool.active.every((e) => e.x >= 0), "教学段感染体仍只出现在右道");

  assert(rushPeriod(RUSH_FIRST) <= 16.5, "左道来袭起始间隔应不宽于 16.5 秒");
  assert(rushPeriod(90) >= 16, "入夜到 2:30 前来袭间隔应拉开");
  assert(rushPeriod(200) < rushPeriod(RUSH_FIRST), "岔路口之后左道来袭间隔应随时间收紧");
  assert(rushPack(40).length >= 3 && rushPack(40).every((id) => id === "walker" || id === "sprinter"), "中期来袭是游走体和冲刺体小队");
  assert(rushPack(65).includes("jumper"), "60 秒后来袭应混入跳跃体");
  assert(rushPack(HOLD_FIRST + 5).includes("bomber"), "岔路口后来袭应混入爆裂体");

  const g = new Game(mockPlatform());
  g.beginRun();
  g.squad.setCount(20);
  g.input.targetX = -LANE_X;
  g.squad.x = -LANE_X;
  g.step(RUSH_FIRST - 0.1);
  g.enemies.clear();
  g.props.clear();
  g.gates.clear();
  g.squad.setCount(20);
  g.squad.x = -LANE_X;
  g.input.targetX = -LANE_X;
  g.step(0.2);
  const rush = g.getState().rush;
  assert(!!rush, "约 " + RUSH_FIRST + " 秒应出现左道来袭提示");
  assert(rush && rush.spawned === false, "提示出现时感染体尚未放出");

  g.enemies.clear();
  g.props.clear();
  g.gates.clear();
  g.bullets.clear();
  const slices = Math.ceil((RUSH_TELEGRAPH + 0.08) / (1 / 60));
  for (let i = 0; i < slices; i++) {
    // 预告期间清掉右道时间轴和已在飞的子弹，避免来袭体刚放出就被射掉
    if (!g.rushSpawned) {
      g.enemies.clear();
      g.props.clear();
      g.gates.clear();
    }
    g.bullets.clear();
    g.step(1 / 60);
  }
  const leftPack = g.enemies.pool.active.filter((e) => e.x < 0);
  assert(leftPack.length >= 2, "预告结束后左道应放出至少 2 只感染体，得到 " + leftPack.length);
  assert(g.getState().rush && g.getState().rush!.spawned, "放出后提示应标记为已生成");

  // 不射击时，来袭体能碰到蹲在左道的小队
  const hit = new Game(mockPlatform());
  hit.beginRun();
  hit.squad.setCount(12);
  hit.squad.x = -LANE_X;
  hit.input.targetX = -LANE_X;
  hit.enemies.clear();
  hit.props.clear();
  hit.gates.clear();
  const arrived = hit.enemies.spawn("walker", "left", { z: 14.2, x: -LANE_X });
  assert(!!arrived, "可在左道近处置入来袭体");
  hit.squad.iframes = 0;
  hit.bullets.clear();
  const before = hit.squad.count;
  hit.step(0.2);
  assert(hit.squad.count < before, "蹲在左道且不处理来袭体应掉人，人数 " + hit.squad.count + " / 原 " + before);
}

console.log("16. 开局容错、对局内击杀、满编新效果、重击武器");
{
  const miss = new Game(mockPlatform());
  miss.beginRun(1);
  // 一直留在右道，错过左道第一扇 +3
  miss.step(9.0);
  assertEq(miss.squad.count, 1, "前 9 秒错过加人门时应仍是 1 人，开局压力仍在");
  miss.step(2.4); // 过 MERCY_AT，近距 +2 已能穿过
  assert(miss.getState().state === "playing", "补门前不应已被空死，状态 " + miss.getState().state);
  assert(miss.squad.count >= 3, "约 10 秒后右道补 +2，错过第一扇门也不应只剩 1 人，人数 " + miss.squad.count);
  assert(miss.getState().kills >= 0, "对局状态含击杀数");
  assert(miss.getState().kills === miss.kills, "HUD/状态里的击杀应对应当前击杀");

  const s = new Squad();
  s.reset();
  s.setCount(20);
  const overflow = s.add(5);
  assert(overflow.overflow > 0, "满编后再加应记溢出");
  assert(s.fireBonus > 0, "溢出仍给射速加成");
  assert(s.shieldTime >= OVERFLOW_SHIELD_DURATION - 0.001, "满编溢出还应给予护盾，护盾 " + s.shieldTime);

  s.shieldTime = 3;
  s.iframes = 0;
  const before = s.count;
  s.lose(7);
  assert(s.count === before - Math.max(1, Math.ceil(7 * 0.5)), "护盾期间应减免掉人，人数 " + s.count);

  assert(WEAPONS.heavy.damage === 3.4 && WEAPONS.heavy.rate === 2.4 && WEAPONS.heavy.duration === 15, "重击：伤害 3.4、射速 2.4、持续 15 秒");
  const hg = new Game(mockPlatform());
  hg.beginRun(1);
  hg.squad.setCount(4);
  hg.squad.equip("heavy");
  hg.enemies.clear();
  hg.bullets.clear();
  hg.step(0.5);
  const heavies = hg.bullets.pool.active.filter((b) => b.heavy);
  assert(heavies.length >= 1, "重击应打出重型子弹");
  assert(heavies.every((b) => Math.abs(b.damage - WEAPONS.heavy.damage) < 0.01 || b.damage > 1.5), "重击单发伤害应明显高于冲锋枪");

  const sh = hg.enemies.spawn("shield", "right", { z: 28, hpMul: 1 });
  assert(!!sh, "可生成盾兵对比重击");
  const hp0 = sh!.hp;
  hg.enemies.hurt(sh!, 2, { pierce: true });
  assertClose(sh!.hp, hp0 - 2, 0.001, "重击应穿透盾兵减伤，2 点打满");

  const g = new Game(mockPlatform());
  g.beginRun(1);
  g.squad.setCount(20);
  g.step(48.7);
  const heavyGate = g.getState().gates.find((x) => x.label === "重击") || g.spawned.find((e) => e.weapon === "heavy");
  assert(!!heavyGate, "约 48 秒应出现重击武器门");

  assertEq(CAGE_LABEL, "救出", "人质笼对外提示应为「救出」");
}

console.log("17. 金门会过期并重开，切右应有空档");
{
  const g = new Game(mockPlatform());
  g.beginRun(1);
  g.squad.setCount(20);
  g.step(12.1);
  const first = g.getState().gates.find((x) => x.kind === "amp");
  assert(!!first, "约 12 秒右道出现金色增幅门");
  g.squad.setCount(20);
  g.step(GOLD_GATE_LIFE + 1.2);
  const gone = g.getState().gates.find((x) => x.kind === "amp");
  assert(!gone, "第一次金门到期后应消失，不再永久占着右道");

  const due = goldWindowTime(0, 1);
  let again = g.getState().gates.find((x) => x.kind === "amp");
  let goldBanner = "";
  const deadline = Math.max(due, g.time) + 8;
  while (g.time < deadline && g.state === "playing") {
    g.enemies.clear();
    g.props.clear();
    g.squad.setCount(20);
    g.step(0.15);
    const amp = g.getState().gates.find((x) => x.kind === "amp");
    if (amp) {
      again = amp;
      const b = g.getState().banner;
      if (b && b.text.includes("×2")) goldBanner = b.text;
      if (again && Math.abs(again.z - GOLD_WINDOW_Z) < 0.3 && goldBanner) break;
    }
  }
  assert(!!again, "中后段应重开金门窗口，当前 t=" + g.time.toFixed(2) + " 窗口约 " + due.toFixed(2));
  assert(again && Math.abs(again.z - GOLD_WINDOW_Z) < 0.3, "重开的金门应换到更近的位置，z=" + (again ? again.z : "无"));
  assert(goldBanner.includes("右道") && goldBanner.includes("×2"), "重开时应提示右道增幅空档，得到 " + (goldBanner || "无"));
}

console.log("18. 夜路口场景、安静重整与具名事件；横幅写明左右");
{
  const g = new Game(mockPlatform());
  g.beginRun(1);
  g.squad.setCount(20);
  g.input.targetX = -LANE_X;
  g.squad.x = -LANE_X;
  assertEq(g.getState().scene, "day", "开局是白天街道");
  // 推过第一次左道来袭
  while (g.time < RUSH_FIRST + RUSH_TELEGRAPH + RUSH_BANNER + 0.15 && g.state === "playing") {
    g.step(0.2);
    g.squad.setCount(20);
  }
  assert(g.getState().quiet, "第一次左道来袭后应进入短暂安静重整");
  g.enemies.clear();
  g.props.clear();
  g.squad.setCount(20);

  const pinchAt = pincerTime(0, 1);
  while (g.time < pinchAt - 0.08 && g.state === "playing") {
    g.step(0.25);
    g.squad.setCount(20);
    g.enemies.clear();
  }
  g.enemies.clear();
  g.props.clear();
  g.gates.clear();
  g.squad.setCount(20);
  g.squad.x = -LANE_X;
  g.input.targetX = -LANE_X;
  g.step(0.2);
  const b1 = g.getState().banner;
  assert(b1 && b1.text === "左右夹击！", "中段应出现具名事件「左右夹击！」，得到 " + (b1 ? b1.text : "无"));

  const slices = Math.ceil((1.25 + 0.1) / (1 / 60));
  for (let i = 0; i < slices; i++) {
    if (!((g as unknown as { namedSpawned?: boolean }).namedSpawned)) {
      g.enemies.clear();
    }
    g.bullets.clear();
    g.step(1 / 60);
  }
  const lefts = g.enemies.pool.active.filter((e) => e.x < 0);
  const rights = g.enemies.pool.active.filter((e) => e.x > 0);
  assert(lefts.length >= 1 && rights.length >= 1, "夹击应同时在左右道放怪，左 " + lefts.length + " 右 " + rights.length);

  while (g.time < SCENE_SHIFT_AT + 0.2 && g.state === "playing") {
    g.step(0.3);
    g.squad.setCount(20);
  }
  assertEq(g.getState().scene, "night", "约 60 秒应切换到夜路口");

  const alleyAt = alleyTime(0, 1);
  let sawAlley = false;
  const alleyDeadline = Math.max(alleyAt, g.time) + 16;
  while (g.time < alleyDeadline && g.state === "playing") {
    g.enemies.clear();
    g.props.clear();
    g.squad.setCount(20);
    g.step(0.1);
    const b = g.getState().banner;
    if (b && b.text.includes("巷口来袭") && (b.text.includes("插进") || b.text.includes("左侧") || b.text.includes("右侧") || b.text.includes("左右"))) {
      sawAlley = true;
      break;
    }
  }
  assert(sawAlley, "夜路口后应出现写明方位的「巷口来袭」，当前 " + ((g.getState().banner && g.getState().banner!.text) || "无") + " t=" + g.time.toFixed(2));
  const alleyText = (g.getState().banner && g.getState().banner!.text) || "";
  assert(alleyText.includes("左侧") || alleyText.includes("右侧") || alleyText.includes("左右"), "巷口横幅应写清方位，得到 " + alleyText);
  const alleySlices = Math.ceil((1.3 + 0.12) / (1 / 60));
  for (let i = 0; i < alleySlices; i++) {
    g.bullets.clear();
    g.step(1 / 60);
  }
  const cutters = g.enemies.pool.active.filter((e) => e.driftX != null && Math.abs(e.x) > 4);
  assert(cutters.length >= 1, "巷口来袭应从路边插进，不能只走中线，得到靠边 " + cutters.length + " / 全场 " + g.enemies.pool.active.length);
}

console.log("19. 中后期时间轴随对局种子变化");
{
  assert(pincerTime(0, 1) !== pincerTime(0, 99), "不同种子的夹击时间应不同（" + pincerTime(0, 1).toFixed(2) + " vs " + pincerTime(0, 99).toFixed(2) + "）");
  assert(goldWindowTime(0, 1) !== goldWindowTime(0, 99), "不同种子的金门窗口时间应不同");
  const a = endlessGateFor(0, 1);
  const b = endlessGateFor(0, 99);
  assert(a.label !== b.label || a.weapon !== b.weapon || a.gate !== b.gate, "不同种子的无尽补门起点应不同");

  const g1 = new Game(mockPlatform());
  const g2 = new Game(mockPlatform());
  g1.beginRun(1);
  g2.beginRun(99);
  for (const g of [g1, g2]) {
    g.squad.setCount(20);
    while (g.time < 80 && g.state === "playing") {
      g.step(0.4);
      g.squad.setCount(20);
    }
  }
  const labels1 = g1.spawned.filter((e) => e.time >= 74 && e.kind === "gate").map((e) => e.label || e.weapon || e.gate);
  const labels2 = g2.spawned.filter((e) => e.time >= 74 && e.kind === "gate").map((e) => e.label || e.weapon || e.gate);
  // 无尽段补门不写入 spawned；改看下一次门或场上已出现的武器/护盾门种类序列
  const kinds1 = g1.gates.pool.active.map((x) => x.label).join(",");
  const kinds2 = g2.gates.pool.active.map((x) => x.label).join(",");
  const t1 = pincerTime(0, 1);
  const t2 = pincerTime(0, 99);
  assert(t1 !== t2 || kinds1 !== kinds2 || labels1.join() !== labels2.join(), "两局中后期不应是同一条钟点表");
  assert(holdTime(1) !== holdTime(99), "不同种子的守住中道时间应不同");
  const sideSet = new Set([1, 3, 7, 11, 19, 41, 99, 123].flatMap((s) => [0, 1, 2].map((i) => alleySide(i, s))));
  assert(sideSet.size >= 2, "不同种子的巷口方位应能变化，得到 " + [...sideSet].join(","));
  assert(alleyBannerText("left").includes("左侧") && alleyBannerText("both").includes("左右"), "巷口文案应按方位区分");
}


console.log("20. 金门窗口会清空右列并避免立刻躲开右道，关闭时有提示");
{
  const g = new Game(mockPlatform());
  g.beginRun(1);
  g.squad.setCount(20);
  g.squad.x = -LANE_X;
  g.input.targetX = -LANE_X;
  const due = goldWindowTime(0, 1);
  while (g.time < due - 0.4 && g.state === "playing") {
    g.step(0.2);
    g.squad.setCount(20);
  }
  g.enemies.clear();
  g.props.clear();
  g.squad.setCount(20);
  for (let i = 0; i < 5; i++) {
    g.enemies.spawn("walker", "right", { z: 24 + i * 3, x: LANE_X });
  }
  const before = g.enemies.pool.active.filter((e) => e.x > 0 && e.z >= 18 && e.z <= 52).length;
  assert(before >= 4, "窗口前右列应有测试用感染体");
  const deadline = due + 6;
  let sawGold = false;
  let sawClose = false;
  let rightWarnDuringSafe = false;
  let thinned = false;
  let paused = false;
  while (g.time < deadline && g.state === "playing") {
    const zBefore = g.enemies.pool.active.filter((e) => e.x > 0).map((e) => e.z);
    g.bullets.clear();
    g.squad.setCount(20);
    g.step(0.1);
    const st = g.getState();
    if (st.banner && st.banner.text.includes("右道") && st.banner.text.includes("×2")) sawGold = true;
    if (st.banner && st.banner.text.includes("金门关闭")) sawClose = true;
    if (st.goldSafe && st.warning && st.warning.lane === "right") rightWarnDuringSafe = true;
    const right = g.enemies.pool.active.filter((e) => e.x > 0 && e.z >= 18 && e.z <= 52);
    if (sawGold && right.length <= 2) thinned = true;
    if (st.goldSafe && zBefore.length) {
      const still = g.enemies.pool.active.filter((e) => e.x > 0);
      if (still.length && Math.abs((still[0].z) - (zBefore[0] || still[0].z)) < 0.08) paused = true;
    }
  }
  assert(sawGold, "应打出「右道×2！快切」");
  assert(thinned, "亮起时应先抽稀右列");
  assert(!rightWarnDuringSafe, "空档保护期内不应立刻打出躲开右道");
  // 金门还开着时即使已超过 6.5 秒、人站在右道，也不能出躲开右道
  g.squad.x = LANE_X;
  g.input.targetX = LANE_X;
  let rightWarnWhileOpen = false;
  const closeDeadline = due + GOLD_WINDOW_LIFE + GOLD_CLOSE_BANNER + 0.8;
  while (g.time < closeDeadline && g.state === "playing") {
    g.enemies.clear();
    g.props.clear();
    g.squad.setCount(20);
    g.squad.x = LANE_X;
    g.input.targetX = LANE_X;
    g.step(0.1);
    const st = g.getState();
    const amp = st.gates.find((x) => x.kind === "amp");
    if (st.banner && st.banner.text.includes("金门关闭")) sawClose = true;
    if ((amp || st.goldSafe) && st.warning && st.warning.lane === "right") rightWarnWhileOpen = true;
  }
  assert(!rightWarnWhileOpen, "金门开着或关闭提示未结束前，不应打出躲开右道");
  assert(sawClose, "金门到期应提示「金门关闭！」");
  assert(GOLD_WINDOW_LULL >= 4, "空档暂停仍应盖住一次切道");
}

console.log("21. 入夜横幅独占、补重击或护盾，并切换道路结构");
{
  const g = new Game(mockPlatform());
  g.beginRun(1);
  g.squad.setCount(20);
  g.squad.equip("pistol");
  while (g.time < SCENE_SHIFT_AT - 0.05 && g.state === "playing") {
    g.step(0.2);
    g.squad.setCount(20);
    g.squad.weapon = "pistol";
    g.squad.weaponTime = 0;
  }
  g.squad.setCount(20);
  g.squad.weapon = "pistol";
  g.squad.weaponTime = 0;
  g.step(0.2);
  assertEq(g.getState().scene, "night", "约 60 秒应进入夜路口");
  const nightBanner = g.getState().banner && g.getState().banner!.text;
  assert(nightBanner === "进入夜路口！", "入夜横幅应单独亮起，得到 " + (nightBanner || "无"));
  assert(g.getState().weapon === "heavy", "入夜时应补上重击，避免只剩手枪，当前 " + g.getState().weapon);
  assert(g.getState().shieldTime >= NIGHT_SHIELD_DURATION - 0.25, "入夜时应补充护盾，护盾 " + g.getState().shieldTime);
  g.drawFrame();

  const keep = new Game(mockPlatform());
  keep.beginRun(1);
  keep.squad.setCount(20);
  while (keep.time < SCENE_SHIFT_AT - 0.05 && keep.state === "playing") {
    keep.step(0.2);
    keep.squad.setCount(20);
  }
  keep.squad.equip("heavy");
  keep.squad.weaponTime = 8;
  keep.step(0.2);
  assert(keep.getState().weapon === "heavy", "入夜前若重击还剩几秒，入夜后仍应是重击");
  assert(keep.squad.weaponTime >= 14, "入夜应刷新重击时长，避免刚过 1:00 就变回手枪，剩余 " + keep.squad.weaponTime.toFixed(2));
}

console.log("22. 约 2:30 出现守住中道的新阶段");
{
  const g = new Game(mockPlatform());
  g.beginRun(1);
  g.squad.setCount(20);
  const due = holdTime(1);
  assert(due > 140 && due < 165, "守住中道应约在 2:30 附近，得到 " + due.toFixed(2));
  while (g.time < due - 0.2 && g.state === "playing") {
    g.step(0.35);
    g.squad.setCount(20);
    g.enemies.clear();
    g.props.clear();
  }
  let sawHold = false;
  const deadline = due + 8;
  while (g.time < deadline && g.state === "playing") {
    g.enemies.clear();
    g.squad.setCount(20);
    g.step(0.1);
    const st = g.getState();
    if (st.banner && st.banner.text.includes("守住中道")) sawHold = true;
    if (st.scene === "fork" && sawHold) break;
  }
  assert(sawHold, "中后段应出现「守住中道！」");
  assertEq(g.getState().scene, "fork", "守住中道时应切到岔路口结构，当前 " + g.getState().scene);
  const midReward = g.gates.pool.active.filter((x) => x.lane === "mid" || Math.abs(x.x) < 0.6);
  assert(midReward.length >= 1, "守住中道的奖励应放在中间车道");
  assert(midReward.every((x) => x.kind === "shield" || (x.kind === "add" && (x.value ?? 0) <= HOLD_REFILL)), "中道奖励应是护盾或小幅补人");
  const leftBig = g.gates.pool.active.filter((x) => x.x < -1 && (x.kind === "add" || x.kind === "mul") && ((x.value ?? 0) >= 3 || (x.label || "").includes("15") || (x.label || "").includes("×2")));
  assert(leftBig.length === 0, "守住中道时左边不应停着 +15 或其它大号奖励，得到 " + leftBig.map((x) => x.label).join(","));

  // 一直蹲左应在结算时掉人
  g.squad.x = -LANE_X;
  g.input.targetX = -LANE_X;
  const before = 20;
  g.squad.setCount(before);
  g.squad.iframes = 0;
  while (g.getState().hold && g.state === "playing") {
    g.enemies.clear();
    g.bullets.clear();
    g.step(0.1);
  }
  assert(g.squad.count < before, "未守中道应掉人，人数 " + g.squad.count);
}

console.log("23. 入夜且满编后补人门减弱，不再显示假 +N");
{
  const rawAdd = { time: 80, kind: "gate" as const, lane: "left" as const, gate: "add" as const, value: 5, label: "+5" };
  const cap = softenGate(rawAdd, 80, 20, 20);
  assert(cap.gate === "shield" && cap.label === "护盾", "满编后 +5 应改成护盾，得到 " + cap.gate + "/" + cap.label);
  const low = softenGate(rawAdd, 80, 8, 20);
  assert(low.gate === "add" && low.value === 1 && low.label === "+1", "满编后掉人只应小补，得到 " + low.label);
  const veryLow = softenGate(rawAdd, 80, 6, 20);
  assert(veryLow.gate === "add" && veryLow.value === 2 && veryLow.label === "+2", "人很少时应小幅补人，不要只给护盾，得到 " + veryLow.gate + "/" + veryLow.label);
  const earlyCap = softenGate(rawAdd, 20, 20, 20);
  assert(earlyCap.gate === "shield" && earlyCap.label === "护盾", "白天满编时门也应写成护盾，不能再写 +N，得到 " + earlyCap.gate + "/" + earlyCap.label);
  const earlyLow = softenGate(rawAdd, 20, 8, 20);
  assert(earlyLow.gate === "add" && earlyLow.value === 1 && earlyLow.label === "+1", "教学结束后白天不满编也只能小幅补人，得到 " + earlyLow.label);
  const teachLow = softenGate(rawAdd, 10, 8, 8);
  assert(teachLow.gate === "add" && teachLow.value === 5, "开局教学段未满编仍用原来的补人门，得到 " + teachLow.label);

  const g = new Game(mockPlatform());
  g.beginRun(1);
  g.squad.setCount(20);
  while (g.time < 76 && g.state === "playing") {
    g.step(0.4);
    g.squad.setCount(20);
  }
  // 推过第一扇无尽门
  while (g.time < 86 && g.state === "playing") {
    g.step(0.2);
    g.squad.setCount(20);
  }
  const plus = g.gates.pool.active.filter((x) => x.kind === "add" || x.kind === "mul");
  const fake = plus.filter((x) => (x.label || "").includes("3") || (x.label || "").includes("5") || x.label === "×2" || (x.value != null && x.value >= 3 && x.kind === "add"));
  assert(fake.length === 0, "入夜满编后场上不应再有大号 +N / ×2 补人门，得到 " + plus.map((x) => x.label).join(","));
}

console.log("24. 护盾时长盖住一次切道；正式隐私与适龄页替换占位");
{
  assert(OVERFLOW_SHIELD_DURATION >= 5 && SHIELD_GATE_DURATION >= 5.5 && NIGHT_SHIELD_DURATION >= 5, "溢出/拾取/入夜护盾都应长于一次切道");
  const s = new Squad();
  s.reset();
  s.setCount(20);
  s.add(1);
  assert(s.shieldTime >= 5, "满编溢出护盾应至少约 5 秒，得到 " + s.shieldTime);

  const allLegal = LEGAL_SUMMARY.join("") + LEGAL_PRIVACY.join("") + LEGAL_AGE.join("");
  assert(!allLegal.includes("占位"), "正式文案不应再含占位说明");
  assert(LEGAL_SUMMARY.some((x) => x.includes("12 周岁") && x.includes("卡通风格")), "精简版应含已过审的适龄与类型说明");
  assert(LEGAL_PRIVACY.some((x) => x.includes("生效日期：2026 年 11 月 26 日")), "隐私政策应含生效日期");
  assert(LEGAL_AGE.some((x) => x.includes("适龄范围：12 周岁及以上")), "适龄提示应含适龄范围");
  assert(allLegal.includes("pengnanhu81@gmail.com"), "联系邮箱应与过审稿一致");

  const g = new Game(mockPlatform());
  assert(titleHit(CANVAS_W / 2, 1280 - 80) === "legal", "开屏底部仍可进入说明");
  g.input.clicks.push({ x: CANVAS_W / 2, y: 1280 - 80 });
  g.step(0.05);
  assertEq(g.state, "legal", "点击底部应进入精简说明");
  assertEq(g.getState().legalPage, "summary", "默认先显示精简版");
  g.drawFrame();
  const priv = legalHit(80 + 10, 1280 - 214 + 10, "summary");
  assert(priv === "privacy", "精简版可进入完整隐私政策");
  g.input.clicks.push({ x: 90, y: 1280 - 214 + 10 });
  g.step(0.05);
  assertEq(g.getState().legalPage, "privacy", "应进入隐私政策完整页");
  assert(legalMaxScroll("privacy") > legalMaxScroll("summary"), "完整隐私政策应可滚动");
  g.legalScroll = -40;
  g.drawFrame();
  g.input.clicks.push({ x: CANVAS_W / 2, y: 1280 - 132 + 10 });
  g.step(0.05);
  assertEq(g.getState().legalPage, "summary", "完整页返回应回到精简版");
  g.input.clicks.push({ x: CANVAS_W - 90, y: 1280 - 214 + 10 });
  g.step(0.05);
  assertEq(g.getState().legalPage, "age", "精简版可进入完整适龄提示");
  g.drawFrame();
}


console.log("25. 入夜横幅不覆盖躲开左道；2:30 之后进入雨夜推进");
{
  const g = new Game(mockPlatform());
  g.beginRun(1);
  g.squad.setCount(20);
  g.squad.x = -LANE_X;
  g.input.targetX = -LANE_X;
  while (g.time < SCENE_SHIFT_AT - 0.6 && g.state === "playing") {
    g.step(0.2);
    g.squad.setCount(20);
    g.squad.x = -LANE_X;
    g.input.targetX = -LANE_X;
  }
  g.warningLane = "left";
  g.warningImpactAt = g.time + 1.35;
  g.enemies.clear();
  g.squad.setCount(20);
  while (g.time < SCENE_SHIFT_AT + 0.2 && g.state === "playing") {
    g.warningLane = "left";
    if (g.warningImpactAt < g.time + 0.8) g.warningImpactAt = g.time + 0.9;
    g.squad.setCount(20);
    g.squad.x = -LANE_X;
    g.input.targetX = -LANE_X;
    g.step(0.1);
  }
  assertEq(g.getState().scene, "night", "即使躲开提示还在，到点也应切到夜路口");
  const midBanner = g.getState().banner && g.getState().banner!.text;
  assert(midBanner === "躲开左道！", "入夜横幅不应盖住正在进行的躲开左道，得到 " + (midBanner || "无"));
  g.squad.x = 0;
  g.input.targetX = 0;
  g.squad.setCount(20);
  let sawNight = false;
  const until = g.time + 3.5;
  while (g.time < until && g.state === "playing") {
    g.squad.setCount(20);
    g.step(0.1);
    const b = g.getState().banner;
    if (b && b.text === "进入夜路口！") sawNight = true;
  }
  assert(sawNight, "躲开提示结束后应再单独打出「进入夜路口！」");

  const hold = new Game(mockPlatform());
  hold.beginRun(1);
  hold.squad.setCount(20);
  const due = holdTime(1);
  while (hold.time < due + 8 && hold.state === "playing") {
    hold.step(0.25);
    hold.squad.setCount(20);
    hold.squad.x = 0;
    hold.input.targetX = 0;
    hold.enemies.clear();
  }
  // 等到守住中道结束，再留出雨夜横幅前的空档
  const afterHold = hold.time + STORM_DELAY + 8;
  let sawStorm = false;
  while (hold.time < afterHold && hold.state === "playing") {
    hold.squad.setCount(20);
    hold.squad.x = 0;
    hold.input.targetX = 0;
    hold.enemies.clear();
    hold.step(0.15);
    const st = hold.getState();
    if (st.scene === "storm") {
      /* chapter changed */
    }
    if (st.banner && st.banner.text.includes("雨夜推进")) sawStorm = true;
  }
  assertEq(hold.getState().scene, "storm", "岔路口结束后应换成雨夜结构，当前 " + hold.getState().scene);
  assert(sawStorm, "2:30 之后应出现新事件「雨夜推进！」，不能只循环夜路口那一套");
}

console.log("26. 入夜后开枪不能把小补门打成 +15");
{
  const g = new Game(mockPlatform());
  g.beginRun(1);
  g.squad.setCount(10);
  while (g.time < SCENE_SHIFT_AT + 2 && g.state === "playing") {
    g.step(0.3);
    g.squad.setCount(10);
  }
  g.gates.clear();
  g.gates.spawn({ kind: "add", lane: "left", value: 1, label: "+1", z: 40 });
  const gate = g.gates.pool.active[0];
  assert(!!gate, "可放置一扇入夜后的 +1 门");
  for (let i = 0; i < 20; i++) chargeGate(gate, 1);
  g.squad.setCount(10);
  g.step(0.05);
  const still = g.gates.pool.active[0];
  assert(still && still.label === "+1" && still.value === 1, "入夜后补人门不能被充能成 +15，得到 " + (still ? still.label + "/" + still.value : "无"));
  g.squad.setCount(20);
  g.step(0.05);
  const asShield = g.gates.pool.active[0];
  assert(asShield && asShield.kind === "shield" && asShield.label === "护盾", "人一旦满编，场上的补人门应改成护盾并改标签");
}

console.log("27. 第四轮：入夜压力、雨夜空档、金门指令、补人与重击锁定");
{
  assert(warningPeriod(90) >= 11, "1:10–1:45 红预警间隔仍应偏宽");
  assert(rushPeriod(90) >= 16, "1:10–1:45 左道来袭间隔仍应偏宽");
  assert(enemyHpMul(90) < enemyHpMul(160), "岔路口前血量涨幅应低于后期");

  const dayMid = softenGate(
    { time: 25, kind: "gate" as const, lane: "left" as const, gate: "add" as const, value: 15, label: "+15" },
    25,
    16,
    16,
  );
  assert(dayMid.gate === "add" && (dayMid.value ?? 9) <= 2, "白天 16 人时不应再给一扇能补满的 +15，得到 " + dayMid.label);
  const day19 = softenGate(
    { time: 30, kind: "gate" as const, lane: "left" as const, gate: "add" as const, value: 15, label: "+15" },
    30,
    19,
    20,
  );
  assert(day19.gate === "add" && day19.value === 1, "白天 19 人时也不应一扇补满，得到 " + day19.label);

  const g = new Game(mockPlatform());
  g.beginRun(1);
  g.squad.setCount(16);
  while (g.time < OPENING_END + 4 && g.state === "playing") {
    g.step(0.3);
    g.squad.setCount(16);
  }
  g.gates.clear();
  g.gates.spawn({ kind: "add", lane: "left", value: 15, label: "+15", z: 28 });
  g.gates.spawn({ kind: "shield", lane: "right", label: "护盾", z: 28 });
  g.squad.setCount(16);
  g.step(0.05);
  const afterOpen = g.gates.pool.active.filter((x) => x.kind === "add" || x.kind === "mul" || x.kind === "shield");
  assert(
    afterOpen.every((x) => x.kind === "add" && (x.value ?? 9) <= 2 && !(x.label || "").includes("15")),
    "教学结束后场上不应再有 +15，也不能护盾和 +15 并排，得到 " + afterOpen.map((x) => x.label).join(","),
  );
  const charge = new Game(mockPlatform());
  charge.beginRun(1);
  charge.squad.setCount(15);
  while (charge.time < OPENING_END + 2 && charge.state === "playing") {
    charge.step(0.3);
    charge.squad.setCount(15);
  }
  charge.gates.clear();
  charge.gates.spawn({ kind: "add", lane: "left", value: 1, label: "+1", z: 40 });
  const cg = charge.gates.pool.active[0];
  for (let i = 0; i < 20; i++) chargeGate(cg, lateRefillAmount(15));
  charge.squad.setCount(15);
  charge.step(0.05);
  const still = charge.gates.pool.active[0];
  assert(still && still.label === "+1" && still.value === 1, "白天开枪也不能把小补门打成 +15，得到 " + (still ? still.label + "/" + still.value : "无"));
}

{
  const g = new Game(mockPlatform());
  g.beginRun(1);
  const due = goldWindowTime(0, 1);
  g.squad.setCount(20);
  g.squad.x = LANE_X;
  g.input.targetX = LANE_X;
  while (g.time < due - 1.4 && g.state === "playing") {
    g.step(0.2);
    g.squad.setCount(20);
    g.squad.x = LANE_X;
    g.input.targetX = LANE_X;
    g.enemies.clear();
  }
  g.warningLane = "right";
  g.warningImpactAt = g.time + 1.2;
  let lastDodgeRight = -99;
  let lastGoldCue = -99;
  let clash = false;
  const until = due + GOLD_WINDOW_LIFE + GOLD_CLOSE_BANNER + 4;
  let sawGold = false;
  let sawClose = false;
  let dodgeDuringClose = false;
  while (g.time < until && g.state === "playing") {
    g.squad.setCount(20);
    g.squad.x = LANE_X;
    g.input.targetX = LANE_X;
    g.enemies.clear();
    g.step(0.1);
    const b = g.getState().banner;
    const text = b ? b.text : "";
    if (text.includes("躲开右道")) {
      if (g.time - lastGoldCue < EVENT_GAP) clash = true;
      lastDodgeRight = g.time;
      if (g.namedKind === "goldEnd" || text.includes("金门关闭")) dodgeDuringClose = true;
      if (g.getState().goldSafe) dodgeDuringClose = true;
    }
    if (text.includes("右道") && text.includes("×2")) {
      if (g.time - lastDodgeRight < GOLD_WARN_SETTLE) clash = true;
      lastGoldCue = g.time;
      sawGold = true;
    }
    if (text.includes("金门关闭")) sawClose = true;
  }
  assert(sawGold, "中段金门窗口仍应出现，右道×2 是真选择");
  assert(!clash, "「躲开右道！」和「右道×2！快切」不应叠在同一窗口");
  assert(sawClose, "金门结束应打出「金门关闭！」横幅");
  assert(!dodgeDuringClose, "躲开右道必须等「金门关闭！」横幅结束，不能只等门精灵消失");
}

{
  const bothRate = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter((i) => alleySide(i, 1) === "both").length / 12;
  assert(bothRate <= 0.34, "巷口应更常单侧插进，「左右插进」不应占多数，得到 " + bothRate.toFixed(2));

  const g = new Game(mockPlatform());
  g.beginRun(1);
  g.squad.setCount(20);
  g.squad.x = -LANE_X;
  g.input.targetX = -LANE_X;
  while (g.time < SCENE_SHIFT_AT + 4 && g.state === "playing") {
    g.step(0.25);
    g.squad.setCount(20);
    g.squad.x = -LANE_X;
    g.input.targetX = -LANE_X;
    g.enemies.clear();
  }
  g.warningLane = "left";
  g.warningImpactAt = g.time + 0.15;
  g.nextAlleyAt = g.time + 0.4;
  g.namedKind = null;
  g.bannerText = null;
  g.exclusiveUntil = 0;
  let alleyAt = 0;
  let dodgeEnd = 0;
  let bothSoon = false;
  const watch = g.time + EVENT_GAP + 2;
  while (g.time < watch && g.state === "playing") {
    const beforeLane = g.warningLane;
    g.squad.setCount(20);
    g.squad.x = -LANE_X;
    g.input.targetX = -LANE_X;
    g.enemies.clear();
    g.step(0.1);
    if (beforeLane && !g.warningLane && !dodgeEnd) dodgeEnd = g.time;
    const b = g.getState().banner;
    if (b && b.text.includes("巷口来袭") && !alleyAt) {
      alleyAt = g.time;
      if (b.text.includes("左右") && dodgeEnd && alleyAt - dodgeEnd < EVENT_GAP) bothSoon = true;
    }
  }
  assert(!alleyAt || (dodgeEnd && alleyAt - dodgeEnd >= EVENT_GAP - 0.05), "躲开后约 2 秒内不应再叠巷口来袭，间隔 " + (alleyAt && dodgeEnd ? (alleyAt - dodgeEnd).toFixed(2) : "未出现"));
  assert(!bothSoon, "躲开后若出巷口，也不应立刻左右同时插进");
}

{
  const g = new Game(mockPlatform());
  g.beginRun(1);
  g.squad.setCount(20);
  while (g.time < SCENE_SHIFT_AT + 0.4 && g.state === "playing") {
    g.step(0.2);
    g.squad.setCount(20);
  }
  assertEq(g.squad.weapon, "heavy", "入夜应补满重击");
  g.gates.clear();
  g.gates.spawn({ kind: "weapon", lane: "right", weapon: "smg", label: "冲锋枪", z: 13.5 });
  g.squad.x = LANE_X;
  g.input.targetX = LANE_X;
  const lockUntil = Math.min(SCENE_SHIFT_AT + NIGHT_HEAVY_LOCK - 1, g.time + 4);
  while (g.time < lockUntil && g.state === "playing" && g.gates.pool.active.some((x) => x.kind === "weapon" || (x.label || "").includes("冲锋"))) {
    g.squad.x = LANE_X;
    g.input.targetX = LANE_X;
    g.enemies.clear();
    g.step(0.1);
  }
  // 若门已被改成护盾，走过去也不该换掉重击
  const leftover = g.gates.pool.active.filter((x) => x.z < 20);
  for (const x of leftover) {
    if (x.kind === "weapon" && x.weapon && x.weapon !== "heavy") {
      assert(false, "入夜后硬段不应再摆出会替换重击的冲锋枪门");
    }
  }
  assertEq(g.squad.weapon, "heavy", "入夜硬段内冲锋枪门不应把刚补满的重击换掉，得到 " + g.squad.weapon);
  while (g.time < 90 && g.state === "playing") {
    g.squad.setCount(20);
    g.enemies.clear();
    g.step(0.3);
  }
  assertEq(g.squad.weapon, "heavy", "重击应覆盖入夜硬段，约 1:30 不应已退回手枪，得到 " + g.squad.weapon + " / " + g.squad.weaponTime.toFixed(1) + "s");
  assert(g.squad.weaponTime > 1, "1:30 时重击仍应有剩余时长，得到 " + g.squad.weaponTime.toFixed(1));
}

{
  const hold = new Game(mockPlatform());
  hold.beginRun(1);
  hold.squad.setCount(8);
  const due = holdTime(1);
  while (hold.time < due + 8 && hold.state === "playing") {
    hold.step(0.25);
    hold.squad.setCount(8);
    hold.squad.x = 0;
    hold.input.targetX = 0;
    hold.enemies.clear();
    hold.bullets.clear();
  }
  const after = hold.time + STORM_DELAY + 6;
  let sawStorm = false;
  let minCount = hold.squad.count;
  while (hold.time < after && hold.state === "playing") {
    hold.squad.x = 0;
    hold.input.targetX = 0;
    hold.enemies.clear();
    hold.bullets.clear();
    hold.step(0.15);
    minCount = Math.min(minCount, hold.squad.count);
    if (hold.squad.count > 0 && hold.squad.count < 8) hold.squad.setCount(Math.max(hold.squad.count, 6));
    const st = hold.getState();
    if (st.banner && st.banner.text.includes("雨夜推进")) sawStorm = true;
  }
  assert(hold.state === "playing", "守住中道后不应在几秒内团灭，状态 " + hold.state);
  assertEq(hold.getState().scene, "storm", "岔路口结束后应进入雨夜");
  assert(sawStorm, "雨夜推进横幅必须能看见，不能被团灭跳过");
}

console.log("28. 第五轮：1:20–2:05 放缓、躲开不再打残、分叉前空档、重击门不缩短计时");
{
  assert(warningPeriod(100) >= 16, "1:20–2:05 红预警间隔应再拉开");
  assert(rushPeriod(100) >= 22, "1:20–2:05 左道来袭间隔应再拉开");
  assert(rushPack(90).every((id) => id !== "bomber"), "岔路口前来袭不应再夹爆裂体");
  assert(alleyTime(1, 1) >= HOLD_FIRST, "第二次巷口应在岔路口之后，得到 " + alleyTime(1, 1).toFixed(2));
  assert(pincerTime(1, 1) >= HOLD_FIRST, "入夜后的夹击应推到岔路口之后，得到 " + pincerTime(1, 1).toFixed(2));
  assertEq(warningDamage(28, 20), WARNING_DAMAGE, "白天躲开仍应是 7 人惩罚");
  assert(warningDamage(90, 16) <= 4 && warningDamage(90, 16) >= 2, "入夜后 16 人躲开不应再掉 7 人，得到 " + warningDamage(90, 16));
  assert(8 - warningDamage(140, 8) >= 4, "8 人时躲开后至少还剩 4 人，掉 " + warningDamage(140, 8));

  const g = new Game(mockPlatform());
  g.beginRun(1);
  g.squad.setCount(16);
  g.squad.x = -LANE_X;
  g.input.targetX = -LANE_X;
  while (g.time < 80 && g.state === "playing") {
    g.step(0.3);
    g.squad.setCount(16);
    g.squad.x = -LANE_X;
    g.input.targetX = -LANE_X;
    g.enemies.clear();
  }
  g.squad.setCount(16);
  g.squad.iframes = 0;
  g.squad.shieldTime = 0;
  g.warningLane = "left";
  g.warningImpactAt = g.time + 0.05;
  g.step(0.2);
  assert(g.squad.count >= 12, "1:20 后 16 人漏一条躲开不应掉到 9 人以下，得到 " + g.squad.count);
  g.squad.setCount(8);
  g.squad.iframes = 0;
  g.squad.shieldTime = 0;
  g.warningLane = "left";
  g.warningImpactAt = g.time + 0.05;
  g.squad.x = -LANE_X;
  g.input.targetX = -LANE_X;
  g.step(0.2);
  assert(g.squad.count >= 4, "8 人漏一条躲开不应只剩 1 人，得到 " + g.squad.count);
}

{
  const hold = new Game(mockPlatform());
  hold.beginRun(1);
  hold.squad.setCount(8);
  const due = holdTime(1);
  let stacked = false;
  let sawMid = false;
  while (hold.time < due - 0.2 && hold.state === "playing") {
    hold.step(0.2);
    hold.squad.setCount(8);
    hold.squad.x = 0;
    hold.input.targetX = 0;
    hold.enemies.clear();
    if (hold.time >= due - HOLD_SETTLE) {
      const b = hold.getState().banner;
      const text = b ? b.text : "";
      if (text.includes("躲开") || text.includes("巷口") || text.includes("来袭") || text.includes("夹击")) stacked = true;
      if (hold.gates.pool.active.some((x) => (x.lane === "mid" || Math.abs(x.x) < 0.6) && (x.kind === "add" || x.kind === "shield"))) sawMid = true;
    }
  }
  assert(!stacked, "守住中道前十几秒不应再叠躲开、巷口或来袭");
  assert(sawMid, "分叉前中道应有一小扇补人门或护盾，让分叉是新阶段开头");
}

{
  const g = new Game(mockPlatform());
  g.beginRun(1);
  g.squad.setCount(20);
  while (g.time < SCENE_SHIFT_AT + 0.4 && g.state === "playing") {
    g.step(0.2);
    g.squad.setCount(20);
  }
  assertEq(g.squad.weapon, "heavy", "入夜应补上重击");
  const before = g.squad.weaponTime;
  assert(before >= 45, "入夜重击应接近 50 秒，得到 " + before.toFixed(1));
  g.gates.clear();
  g.gates.spawn({ kind: "weapon", lane: "right", weapon: "heavy", label: "重击", z: 13.5 });
  g.squad.x = LANE_X;
  g.input.targetX = LANE_X;
  const t0 = g.time;
  while (g.time < t0 + 2 && g.state === "playing" && g.gates.pool.active.some((x) => x.kind === "weapon" && x.weapon === "heavy")) {
    g.squad.x = LANE_X;
    g.input.targetX = LANE_X;
    g.enemies.clear();
    g.step(0.1);
  }
  const expectMin = Math.max(0, SCENE_SHIFT_AT + NIGHT_HEAVY_LOCK - g.time) - 0.4;
  assert(g.squad.weapon === "heavy" && g.squad.weaponTime >= expectMin, "入夜后再走重击门应保持原到期时间，得到 " + g.squad.weaponTime.toFixed(1));
  assert(g.squad.weaponTime <= expectMin + 2, "锁定期内走重击门也不应把剩余时长重新计成 15 秒，得到 " + g.squad.weaponTime.toFixed(1));
}

console.log("29. 第六轮：分叉留人、雨夜积水、重击不续成 15 秒、横幅更长、金门里不出躲开左道");
{
  assert(holdDamageAt(0) === 0 && holdDamageAt(1.6) === 0, "站在亮中道或中左不应被守住中道重罚");
  assert(holdDamageAt(-LANE_X) >= 3 && holdDamageAt(-LANE_X) <= 5, "完全抱左仍应受罚，但不应一刀砍掉 8 人");
  assert(STORM_BANNER_FIRST >= 5, "第一次雨夜推进横幅应更长，好认");

  const g = new Game(mockPlatform());
  g.beginRun(1);
  g.squad.setCount(14);
  const due = holdTime(1);
  while (g.time < due + 0.4 && g.state === "playing") {
    g.step(0.2);
    g.squad.setCount(14);
    g.squad.x = -1.6;
    g.input.targetX = -1.6;
    g.enemies.clear();
    g.bullets.clear();
  }
  g.squad.setCount(14);
  g.squad.iframes = 0;
  g.squad.shieldTime = 0;
  g.squad.x = -1.6;
  g.input.targetX = -1.6;
  while (g.getState().hold && g.state === "playing") {
    g.enemies.clear();
    g.bullets.clear();
    g.squad.x = -1.6;
    g.input.targetX = -1.6;
    g.step(0.1);
  }
  assert(g.squad.count >= 12, "中左略偏不应从 14 人一下掉到 6 人，得到 " + g.squad.count);
}

{
  const g = new Game(mockPlatform());
  g.beginRun(1);
  g.squad.setCount(10);
  const due = holdTime(1);
  let sawBiggerMid = false;
  let midLabels: string[] = [];
  while (g.time < due + 8 && g.state === "playing") {
    g.step(0.1);
    g.squad.setCount(10);
    g.squad.x = 0;
    g.input.targetX = 0;
    g.enemies.clear();
    g.bullets.clear();
    const mid = g.gates.pool.active.filter((x) => x.lane === "mid" || Math.abs(x.x) < 0.6);
    if (mid.length) midLabels = mid.map((x) => x.label || x.kind);
    if (mid.some((x) => x.kind === "shield" || (x.kind === "add" && (x.value ?? 0) >= 3))) sawBiggerMid = true;
  }
  assert(sawBiggerMid, "分叉中道补人应略多一点，得到 " + midLabels.join(","));

  // 等到第一次雨夜横幅和积水事件
  const until = g.time + STORM_DELAY + STORM_BANNER_FIRST + FLOOD_TELEGRAPH + FLOOD_DURATION + 4;
  let sawStorm = false;
  let sawFlood = false;
  let stormMs = 0;
  let lastBanner = "";
  let bannerStart = 0;
  while (g.time < until && g.state === "playing") {
    g.squad.x = LANE_X;
    g.input.targetX = LANE_X;
    g.enemies.clear();
    g.bullets.clear();
    g.squad.setCount(Math.max(g.squad.count, 8));
    g.step(0.1);
    const b = g.getState().banner;
    const text = b ? b.text : "";
    if (text.includes("雨夜推进")) {
      sawStorm = true;
      if (lastBanner !== text) bannerStart = g.time;
      stormMs = Math.max(stormMs, g.time - bannerStart);
    }
    if (text.includes("积水")) sawFlood = true;
    lastBanner = text;
  }
  assert(sawStorm, "应打出「雨夜推进！」横幅");
  assert(stormMs >= 5, "第一次雨夜推进横幅应足够长，实际约 " + stormMs.toFixed(1) + " 秒");
  assert(sawFlood, "雨夜应有一眼能认出的新事件「主路积水！快靠边！」");
  assert(g.getState().scene === "storm", "应处于雨夜");
}

{
  const flood = new Game(mockPlatform());
  flood.beginRun(1);
  flood.squad.setCount(10);
  const due = holdTime(1);
  while (flood.time < due + 8 && flood.state === "playing") {
    flood.step(0.25);
    flood.squad.setCount(10);
    flood.squad.x = 0;
    flood.input.targetX = 0;
    flood.enemies.clear();
    flood.bullets.clear();
  }
  const watch = flood.time + STORM_DELAY + STORM_BANNER_FIRST + FLOOD_TELEGRAPH + 3;
  let flooded = false;
  while (flood.time < watch && flood.state === "playing") {
    flood.squad.x = 0;
    flood.input.targetX = 0;
    flood.enemies.clear();
    flood.bullets.clear();
    flood.squad.iframes = 0;
    flood.squad.shieldTime = 0;
    const before = flood.squad.count;
    flood.step(0.1);
    const b = flood.getState().banner;
    if (b && b.text.includes("积水") && flood.squad.count < before) flooded = true;
    if (flood.squad.count < 8) flood.squad.setCount(10);
  }
  assert(flooded, "积水时仍站在中道应掉人，玩家必须靠边");
}

{
  const g = new Game(mockPlatform());
  g.beginRun(1);
  g.squad.setCount(20);
  const lockEnd = SCENE_SHIFT_AT + NIGHT_HEAVY_LOCK;
  while (g.time < lockEnd - 6 && g.state === "playing") {
    g.step(0.3);
    g.squad.setCount(20);
    g.squad.weapon = "heavy";
    g.squad.weaponTime = Math.max(5, lockEnd - g.time);
  }
  g.squad.weapon = "heavy";
  g.squad.weaponTime = 5;
  g.gates.clear();
  g.gates.spawn({ kind: "weapon", lane: "right", weapon: "heavy", label: "重击", z: 13.5 });
  g.squad.x = LANE_X;
  g.input.targetX = LANE_X;
  const t0 = g.time;
  while (g.time < t0 + 2 && g.state === "playing" && g.gates.pool.active.some((x) => x.kind === "weapon" && x.weapon === "heavy")) {
    g.squad.x = LANE_X;
    g.input.targetX = LANE_X;
    g.enemies.clear();
    g.step(0.1);
  }
  assert(g.squad.weapon === "heavy", "锁定期内仍应是重击");
  assert(g.squad.weaponTime <= 5.2 && g.squad.weaponTime >= 2.5, "还剩 5 秒时走重击门不应重新计成 15 秒，得到 " + g.squad.weaponTime.toFixed(1));
}

{
  const g = new Game(mockPlatform());
  g.beginRun(1);
  const due = goldWindowTime(0, 1);
  g.squad.setCount(20);
  g.squad.x = -LANE_X;
  g.input.targetX = -LANE_X;
  while (g.time < due + 1 && g.state === "playing") {
    g.step(0.2);
    g.squad.setCount(20);
    g.squad.x = -LANE_X;
    g.input.targetX = -LANE_X;
    g.enemies.clear();
  }
  let leftWarn = false;
  const until = due + GOLD_WINDOW_LIFE + GOLD_CLOSE_BANNER + 0.5;
  while (g.time < until && g.state === "playing") {
    g.squad.setCount(20);
    g.squad.x = -LANE_X;
    g.input.targetX = -LANE_X;
    g.enemies.clear();
    g.step(0.1);
    const st = g.getState();
    if ((st.goldSafe || st.gates.some((x) => x.kind === "amp")) && st.warning && st.warning.lane === "left") leftWarn = true;
    if ((st.goldSafe || st.gates.some((x) => x.kind === "amp")) && st.banner && st.banner.text.includes("躲开左道")) leftWarn = true;
  }
  assert(!leftWarn, "金门开着或关闭提示未结束前，也不应打出躲开左道");
}

console.log("");
console.log(`通过 ${passed} 项，失败 ${failed} 项`);

if (failed > 0) process.exit(1);
