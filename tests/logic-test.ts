import { TIMELINE, MAX_SQUAD, WEAPONS, ENEMY, FINAL_WAVE_LAST_SPAWN } from "../src/config";
import { Game } from "../src/game";
import { Squad } from "../src/squad";
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
  assert(addAfter70.length === 0, "70 秒后不再出加人门");
  assert(enemies.every((e) => e.enemy === "walker" || e.enemy === "sprinter"), "本阶只有游走体和冲刺体");
  const types = new Set(enemies.map((e) => e.enemy));
  assert(types.has("walker") && types.has("sprinter"), "时间轴包含游走体与冲刺体");
  assert(ENEMY.walker.hp === 3 && ENEMY.walker.speed === 1, "游走体生命 3、移速 1.0");
  assert(ENEMY.sprinter.hp === 2 && ENEMY.sprinter.speed === 1.7, "冲刺体生命 2、移速 1.7");
  assert(WEAPONS.pistol.damage === 1 && WEAPONS.pistol.rate === 4, "手枪伤害 1.0、约 4 发/秒");
  assert(WEAPONS.smg.damage === 0.7 && WEAPONS.smg.rate === 12 && WEAPONS.smg.duration === 15, "冲锋枪数值符合规格");
  const lastEnemy = Math.max(...enemies.map((e) => e.time));
  assertClose(lastEnemy, FINAL_WAVE_LAST_SPAWN, 0.01, "收束波最后出现时间与常量一致");
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

  // 通关：跳到收束波结束后且清场
  const winGame = new Game(mockPlatform());
  winGame.beginRun();
  winGame.squad.setCount(20);
  winGame.step(90.2);
  // 若还有敌人，继续清空（直接清池模拟打完）
  winGame.enemies.clear();
  winGame.step(0.1);
  const ws = winGame.getState();
  assertEq(ws.state, "win", "坚持 90 秒并打完收束波后通关");
  assert(ws.finalWaveSpawned, "收束波已放出");
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
  for (let i = 0; i < 50; i++) game.bullets.spawn(0, 14, 1);
  assert(game.bullets.pool.size <= 40, "同屏子弹不超过 40");
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

console.log("");
console.log(`通过 ${passed} 项，失败 ${failed} 项`);

if (failed > 0) process.exit(1);
