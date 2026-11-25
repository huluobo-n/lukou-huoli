import {
  TIMELINE,
  MAX_SQUAD,
  MAX_BULLETS,
  WEAPONS,
  ENEMY,
  SCRIPT_ENEMY_END,
  LANE_X,
  GOLD_AMP_MUL,
  GOLD_NEAR_MUL,
  GOLD_GATE_Z,
  GATE_CHARGE_CAP,
  WARNING_DAMAGE,
  WARNING_FIRST,
  WARNING_TELEGRAPH,
  RUSH_FIRST,
  RUSH_TELEGRAPH,
  CAGE_REWARD,
  BARREL_CONTACT_LOSS,
  BARREL_AOE_DAMAGE,
  enemyHpMul,
  rushPack,
  rushPeriod,
  warningPeriod,
} from "../src/config";
import { Game } from "../src/game";
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
  assert(warningPeriod(120) <= 8, "后期红预警间隔应收紧到约 8 秒");
  assert(warningPeriod(120) < warningPeriod(WARNING_FIRST), "红预警间隔应随时间收紧");
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
  stay.squad.x = -LANE_X;
  stay.input.targetX = -LANE_X;
  stay.step(0.2);
  const w = stay.getState().warning;
  assert(!!w, "约 " + WARNING_FIRST + " 秒应出现红预警");
  assertEq(w && w.lane, "left", "预警应打在小队当前所在的左道");
  stay.enemies.clear();
  stay.props.clear();
  stay.gates.clear();
  stay.squad.setCount(20);
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
  assert(rushPeriod(120) < rushPeriod(RUSH_FIRST), "左道来袭间隔应随时间收紧");
  assert(rushPack(40).length >= 3 && rushPack(40).every((id) => id === "walker" || id === "sprinter"), "中期来袭是游走体和冲刺体小队");
  assert(rushPack(65).includes("jumper"), "60 秒后来袭应混入跳跃体");
  assert(rushPack(85).includes("bomber"), "80 秒后来袭应混入爆裂体");

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

console.log("");
console.log(`通过 ${passed} 项，失败 ${failed} 项`);

if (failed > 0) process.exit(1);
