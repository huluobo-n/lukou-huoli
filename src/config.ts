/** 路口火力 — 第一阶数值与时间轴（以 phase1-spec.md 为准） */

export const CANVAS_W = 720;
export const CANVAS_H = 1280;
export const ASPECT = CANVAS_W / CANVAS_H;

export const TEAM_Z = 14;
export const SPAWN_Z = 58;
export const DESPAWN_Z = 12.0;
export const HORIZON_Y = 352;
export const NEAR_Y = 958;
export const LANE_X = 3.25;
export const LANE_HALF = 2.55;
export const LANE_SCREEN = 152;
export const ROAD_HALF = 6.4;

export const BASE_SPEED = 14;
export const BULLET_SPEED = 52;
export const BULLET_RANGE_Z = 50;
export const MAX_BULLETS = 80;
export const MAX_ENEMIES = 25;
export const MAX_SQUAD = 20;
export const MAX_PROPS = 8;

export const WEAPONS = {
  pistol: {
    id: "pistol" as const,
    name: "手枪",
    damage: 1.0,
    rate: 4,
    duration: Infinity,
  },
  smg: {
    id: "smg" as const,
    name: "冲锋枪",
    damage: 0.7,
    rate: 12,
    duration: 15,
  },
  heavy: {
    id: "heavy" as const,
    name: "重击",
    damage: 3.4,
    rate: 2.4,
    duration: 15,
  },
};

export type WeaponId = keyof typeof WEAPONS;

export const ENEMY = {
  walker: {
    id: "walker" as const,
    name: "游走体",
    speed: 1.0,
    hp: 3,
    radius: 0.72,
    scale: 1,
    contactLoss: 1,
  },
  sprinter: {
    id: "sprinter" as const,
    name: "冲刺体",
    speed: 1.7,
    hp: 2,
    radius: 0.52,
    scale: 0.78,
    contactLoss: 1,
    dashEvery: 1.8,
    dashDuration: 0.45,
    dashMul: 2.15,
  },
  shield: {
    id: "shield" as const,
    name: "盾兵",
    speed: 0.72,
    hp: 6,
    radius: 0.9,
    scale: 1.18,
    contactLoss: 1,
    damageTakenMul: 0.5,
  },
  bomber: {
    id: "bomber" as const,
    name: "爆裂体",
    speed: 0.88,
    hp: 4,
    radius: 0.8,
    scale: 1.06,
    contactLoss: 3,
  },
  splitter: {
    id: "splitter" as const,
    name: "分裂体",
    speed: 0.95,
    hp: 4,
    radius: 0.78,
    scale: 1.08,
    contactLoss: 1,
  },
  splitling: {
    id: "splitling" as const,
    name: "分裂体",
    speed: 1.15,
    hp: 2,
    radius: 0.48,
    scale: 0.68,
    contactLoss: 1,
  },
  jumper: {
    id: "jumper" as const,
    name: "跳跃体",
    speed: 1.12,
    hp: 3,
    radius: 0.58,
    scale: 0.9,
    contactLoss: 1,
    jumpEvery: 2.1,
    jumpDuration: 0.58,
    jumpHeight: 2.4,
  },
};

export type EnemyId = keyof typeof ENEMY;

export const HIT_IFRAMES = 0.85;
export const OVERFLOW_BONUS_DURATION = 3;
export const OVERFLOW_BONUS_MUL = 1.6;
export const HINT_DURATION = 3;

export const STORAGE_KEY = "lukou-huoli-best";

/** 开枪给加减门充能的上限（显示的带符号整数） */
export const GATE_CHARGE_CAP = 15;

/** 金色子弹增幅门：教学结束后出现在右道中距，固定世界坐标 */
export const GOLD_GATE_AT = 12;
export const GOLD_GATE_Z = 36;
export const GOLD_AMP_MUL = 2;
export const GOLD_NEAR_MUL = 0.5;

/** 教学结束后，存活越久敌人越肉 */
export const HP_SCALE_START = 10;
export const HP_SCALE_PER_SEC = 0.02;

export const HP_SCALE_LATE_START = 60;
export const HP_SCALE_LATE_PER_SEC = 0.012;

export function enemyHpMul(t: number): number {
  if (t <= HP_SCALE_START) return 1;
  let mul = 1 + (t - HP_SCALE_START) * HP_SCALE_PER_SEC;
  if (t > HP_SCALE_LATE_START) mul += (t - HP_SCALE_LATE_START) * HP_SCALE_LATE_PER_SEC;
  return mul;
}

/** 红预警：先约 28 秒出现，之后间隔明显收紧 */
export const WARNING_FIRST = 28;
export const WARNING_TELEGRAPH = 1.2;
export const WARNING_DAMAGE = 7;

export function warningPeriod(t: number): number {
  return Math.max(7, 13.0 - Math.max(0, t - WARNING_FIRST) * 0.07);
}

/** 左道来袭：教学结束后的可读压力事件，惩罚一直蹲左道 */
export const RUSH_FIRST = 36;
export const RUSH_TELEGRAPH = 1.2;
export const RUSH_SPAWN_Z = 42;
export const RUSH_BANNER = 2.4;

export function rushPeriod(t: number): number {
  return Math.max(10, 16.5 - Math.max(0, t - RUSH_FIRST) * 0.05);
}

export function rushPack(t: number): EnemyId[] {
  if (t >= 80) return ["bomber", "jumper", "sprinter"];
  if (t >= 60) return ["jumper", "walker", "sprinter"];
  return ["walker", "walker", "sprinter"];
}

/** 满编溢出时，除射速加成外再给护盾；时长需盖住一次切道 */
export const OVERFLOW_SHIELD_DURATION = 5.5;
export const SHIELD_DAMAGE_MUL = 0.5;
export const SHIELD_GATE_DURATION = 6;
export const CAP_EXPIRE_SHIELD = 5;
export const NIGHT_SHIELD_DURATION = 6;
export const NIGHT_WEAPON_MIN = 6;

/** 约 60 秒切换夜路口场景（道路与建筑结构一并更换） */
export const SCENE_SHIFT_AT = 60;
export const SCENE_BANNER = 2.8;

/** 金色增幅门不再永久停住：第一次持续一段时间后消失，之后短暂重开 */
export const GOLD_GATE_LIFE = 16;
export const GOLD_WINDOW_LIFE = 10;
export const GOLD_WINDOW_LULL = 4.8;
export const GOLD_WINDOW_SAFE = 6.5;
export const GOLD_WINDOW_Z = 32;
export const GOLD_WINDOW_BASE = [58, 94, 132];
export const GOLD_CLOSE_BANNER = 1.6;

/** 第一次左道来袭后的安静重整，再进入具名事件 */
export const RUSH_QUIET = 5.2;
export const PINCER_FIRST = 52;
export const PINCER_TELEGRAPH = 1.25;
export const PINCER_BANNER = 2.6;
export const PINCER_PERIOD = 28;
export const ALLEY_FIRST = 78;
export const ALLEY_TELEGRAPH = 1.3;
export const ALLEY_BANNER = 2.6;
export const ALLEY_PERIOD = 30;
export const ALLEY_SPAWN_Z = 40;
export const ALLEY_SIDE_X = 8.0;

/** 约 2:30 进入岔路口，并短暂要求守住中道 */
export const HOLD_FIRST = 150;
export const HOLD_TELEGRAPH = 1.6;
export const HOLD_DURATION = 5.2;
export const HOLD_DAMAGE = 8;
export const HOLD_MID = 1.15;
export const ENDLESS_GATE_PERIOD_LATE = 14;

/** 错过第一扇加人门时，右道补一扇小 +2，不改开局 10 秒压力 */
export const MERCY_AT = 10.2;
export const MERCY_MAX_COUNT = 2;
export const MERCY_Z = 22;

export function seedOffset(seed: number, key: number, span: number): number {
  const x = Math.imul(seed ^ (key * 0x9e3779b9), 0x85ebca6b) >>> 0;
  return (x / 0xffffffff - 0.5) * 2 * span;
}

export function goldWindowTime(index: number, seed: number): number {
  const base = GOLD_WINDOW_BASE[index] ?? (GOLD_WINDOW_BASE[GOLD_WINDOW_BASE.length - 1] + (index - GOLD_WINDOW_BASE.length + 1) * 34);
  const span = index === 0 ? 2.0 : 4.0;
  return base + seedOffset(seed, 17 + index, span);
}

export function pincerTime(index: number, seed: number): number {
  const span = index === 0 ? 2.0 : 4.5;
  return PINCER_FIRST + index * PINCER_PERIOD + seedOffset(seed, 31 + index, span);
}

export function alleyTime(index: number, seed: number): number {
  return ALLEY_FIRST + index * ALLEY_PERIOD + seedOffset(seed, 53 + index, 5.5);
}

export function holdTime(seed: number): number {
  return HOLD_FIRST + seedOffset(seed, 71, 8);
}

export type AlleySide = "both" | "left" | "right";
export type SceneId = "day" | "night" | "fork";

export function alleySide(index: number, seed: number): AlleySide {
  const x = Math.imul(seed ^ ((91 + index) * 0x9e3779b9), 0x85ebca6b) >>> 0;
  const r = x % 3;
  return r === 0 ? "left" : r === 1 ? "right" : "both";
}

export function alleyBannerText(side: AlleySide): string {
  if (side === "left") return "巷口来袭！左侧插进！";
  if (side === "right") return "巷口来袭！右侧插进！";
  return "巷口来袭！左右插进！";
}

/** 入夜或满编后，减弱补人并把不再加人的门改成护盾，避免仍显示 +N */
export function softenGate(ev: TimelineEvent, time: number, count: number, peak: number): TimelineEvent {
  if (time < SCENE_SHIFT_AT) return ev;
  if (ev.kind !== "gate") return ev;
  if (ev.gate !== "add" && ev.gate !== "mul") return ev;
  if (peak >= MAX_SQUAD && count >= MAX_SQUAD) {
    return { ...ev, gate: "shield", value: undefined, weapon: undefined, label: "护盾" };
  }
  if (peak >= MAX_SQUAD) {
    return { ...ev, gate: "add", value: 1, weapon: undefined, label: "+1" };
  }
  if (ev.gate === "mul") return { ...ev, gate: "add", value: 2, weapon: undefined, label: "+2" };
  const v = Math.max(1, Math.floor((ev.value ?? 3) / 2));
  return { ...ev, value: v, label: "+" + v };
}

export function cageRewardAt(time: number, peak: number): number {
  if (time >= SCENE_SHIFT_AT && peak >= MAX_SQUAD) return 1;
  return CAGE_REWARD;
}

export const CAGE_HP = 8;
export const CAGE_REWARD = 3;
export const CAGE_LABEL = "救出";
export const BARREL_HP = 3;
export const BARREL_AOE_RADIUS = 3.4;
export const BARREL_AOE_DAMAGE = 8;
export const BARREL_CONTACT_LOSS = 2;

export type PropKind = "cage" | "barrel";
export type PropLane = "left" | "right" | "mid";

export interface PropEvent {
  time: number;
  kind: PropKind;
  lane: PropLane;
}

export type GateKind = "add" | "mul" | "weapon" | "red" | "amp" | "shield";

export interface TimelineEvent {
  /** 在远处置入并进入画面的时间（秒） */
  time: number;
  kind: "enemy" | "gate";
  lane: "left" | "right";
  enemy?: EnemyId;
  gate?: GateKind;
  value?: number;
  weapon?: WeaponId;
  label?: string;
}

/**
 * 脚本时间轴：appear/spawn 时间。
 * 游走体约 3.1 秒后抵达小队，冲刺体更快。
 * 教学段过后右道持续出怪，不再留空档；门仍按固定时间出现。
 */
const GATE_EVENTS: TimelineEvent[] = [
  // —— 0–10 秒教学 ——
  { time: 6.0, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
  { time: 7.25, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "冲锋枪" },

  // —— 10–40 秒：左道 +N / ×2 / 武器门 ——
  { time: 11.5, kind: "gate", lane: "left", gate: "add", value: 2, label: "+2" },
  { time: 16.0, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "冲锋枪" },
  { time: 22.0, kind: "gate", lane: "left", gate: "mul", value: 2, label: "×2" },
  { time: 27.0, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
  { time: 32.8, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
  { time: 36.5, kind: "gate", lane: "left", gate: "add", value: 5, label: "+5" },

  // —— 40–70 秒：约 40 秒后出现成对红门 -3 / 蓝门 +3 ——
  { time: 40.5, kind: "gate", lane: "right", gate: "red", value: 3, label: "-3" },
  { time: 40.5, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
  { time: 48.5, kind: "gate", lane: "left", gate: "weapon", weapon: "heavy", label: "重击" },
  { time: 51.0, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
  { time: 58.0, kind: "gate", lane: "left", gate: "red", value: 3, label: "-3" },
  { time: 62.5, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
  { time: 67.0, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "冲锋枪" },
];

/** 右道红门出现前后短暂让道，避免怪和门叠在同一位置 */
export const RIGHT_LANE_GAPS: Array<[number, number]> = [[39.85, 41.15]];

export function inRightLaneGap(time: number): boolean {
  return RIGHT_LANE_GAPS.some(([a, b]) => time >= a && time <= b);
}

export function laneCenterX(lane: "left" | "right" | "mid"): number {
  if (lane === "mid") return 0;
  return lane === "left" ? -LANE_X : LANE_X;
}

export function inLane(x: number, lane: "left" | "right"): boolean {
  return Math.abs(x - laneCenterX(lane)) <= LANE_HALF;
}

export function laneOfX(x: number): "left" | "right" {
  return x < 0 ? "left" : "right";
}

function addEnemy(events: TimelineEvent[], time: number, enemy: EnemyId): void {
  const t = Math.round(time * 100) / 100;
  if (inRightLaneGap(t)) return;
  events.push({ time: t, kind: "enemy", lane: "right", enemy });
}

/** 右道感染体：开局教学后不间断涌来，密度随时间加密 */
function buildHorde(): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // 开局 2–6 秒 5 只游走体，1 人手枪可清掉
  for (let t = 2; t <= 6; t += 1) addEnemy(events, t, "walker");

  // 教学刚结束即接上，不再留空档；前 20 秒只略加密，保证教学可过
  for (let t = 7.2; t < 20; t += 0.5) addEnemy(events, t, "walker");

  // 20–40 秒加密，后半段开始夹冲刺体
  for (let t = 20; t < 40; t += 0.32) {
    addEnemy(events, t, "walker");
    if (t >= 28) addEnemy(events, t + 0.1, "sprinter");
  }

  // 40–70 秒：游走体与冲刺体成对更密地涌来
  for (let t = 40; t < 70; t += 0.34) {
    addEnemy(events, t, "walker");
    addEnemy(events, t + 0.1, "sprinter");
  }

  // 70 秒后脚本段继续加密，之后由对局逻辑无限出怪
  for (let t = 70; t <= 87; t += 0.26) {
    addEnemy(events, t, "walker");
    addEnemy(events, t + 0.08, "sprinter");
  }

  // 新类型在教学段之后更早、更密地登场，不挤在开局 10 秒
  for (let t = 16.0; t <= 87; t += 2.2) addEnemy(events, t, "jumper");
  for (let t = 28.0; t <= 87; t += 2.8) addEnemy(events, t, "shield");
  for (let t = 38.0; t <= 87; t += 3.4) addEnemy(events, t, "bomber");
  for (let t = 50.0; t <= 87; t += 2.8) addEnemy(events, t, "splitter");
  return events;
}

export const TIMELINE: TimelineEvent[] = [...GATE_EVENTS, ...buildHorde()].sort((a, b) => {
  if (a.time !== b.time) return a.time - b.time;
  if (a.kind === b.kind) return 0;
  return a.kind === "gate" ? -1 : 1;
});

/** 脚本段最后一只感染体的出现时间，之后进入无尽出怪 */
const enemyTimes = TIMELINE.filter((e) => e.kind === "enemy").map((e) => e.time);
export const SCRIPT_ENEMY_END = Math.max(...enemyTimes);

/** 无尽段开始补门的时间、间隔，以及循环内容 */
export const ENDLESS_GATE_START = 75;
export const ENDLESS_GATE_PERIOD = 10;

export const ENDLESS_GATE_CYCLE: TimelineEvent[] = [
  { time: 0, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
  { time: 0, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "冲锋枪" },
  { time: 0, kind: "gate", lane: "left", gate: "shield", label: "护盾" },
  { time: 0, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
  { time: 0, kind: "gate", lane: "left", gate: "weapon", weapon: "heavy", label: "重击" },
  { time: 0, kind: "gate", lane: "left", gate: "add", value: 5, label: "+5" },
];

export function endlessGateFor(index: number, seed: number): TimelineEvent {
  const i = (index + (seed >>> 0) % ENDLESS_GATE_CYCLE.length) % ENDLESS_GATE_CYCLE.length;
  return ENDLESS_GATE_CYCLE[i];
}

/** 无尽段成对出怪的间隔，后期继续加密，最短 0.14 秒 */
export function endlessHordeInterval(t: number): number {
  return Math.max(0.14, 0.24 - Math.max(0, t - 70) * 0.002);
}

/** 无尽段轮换出怪，特殊体占比更高 */
export const ENDLESS_MIX: EnemyId[] = [
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
  "bomber",
];

/** 人质笼与油桶：教学结束后少量出现，不淹没既有奖励门 */
export const PROP_EVENTS: PropEvent[] = [
  { time: 18.5, kind: "cage", lane: "left" },
  { time: 24.5, kind: "barrel", lane: "right" },
  { time: 30.2, kind: "cage", lane: "left" },
  { time: 45.5, kind: "barrel", lane: "right" },
  { time: 53.5, kind: "cage", lane: "left" },
  { time: 60.8, kind: "barrel", lane: "right" },
];

export const ENDLESS_PROP_START = 76;
export const ENDLESS_PROP_PERIOD = 18;

export function formatGateLabel(kind: "add" | "red", signed: number): string {
  if (kind === "red" || signed < 0) return String(signed);
  if (signed === 0) return "0";
  return "+" + signed;
}
