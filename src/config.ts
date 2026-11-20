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
export const MAX_BULLETS = 40;
export const MAX_ENEMIES = 25;
export const MAX_SQUAD = 20;
export const VISUAL_FIRE_CAP = 18;

export const RUN_DURATION = 90;

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
};

export type EnemyId = keyof typeof ENEMY;

export const HIT_IFRAMES = 0.85;
export const OVERFLOW_BONUS_DURATION = 3;
export const OVERFLOW_BONUS_MUL = 1.6;
export const HINT_DURATION = 3;

export const STORAGE_KEY = "lukou-huoli-best";

export type GateKind = "add" | "mul" | "weapon" | "red";

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
  { time: 27.0, kind: "gate", lane: "left", gate: "add", value: 5, label: "+5" },
  { time: 32.8, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
  { time: 36.5, kind: "gate", lane: "left", gate: "add", value: 8, label: "+8" },

  // —— 40–70 秒：约 40 秒后出现成对红门 -3 / 蓝门 +3 ——
  { time: 40.5, kind: "gate", lane: "right", gate: "red", value: 3, label: "-3" },
  { time: 40.5, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
  { time: 48.5, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "冲锋枪" },
  { time: 51.0, kind: "gate", lane: "left", gate: "add", value: 5, label: "+5" },
  { time: 58.0, kind: "gate", lane: "left", gate: "red", value: 3, label: "-3" },
  { time: 62.5, kind: "gate", lane: "left", gate: "add", value: 8, label: "+8" },
  { time: 67.0, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "冲锋枪" },
];

/** 右道红门出现前后短暂让道，避免怪和门叠在同一位置 */
const RIGHT_LANE_GAPS: Array<[number, number]> = [[39.85, 41.15]];

function inRightLaneGap(time: number): boolean {
  return RIGHT_LANE_GAPS.some(([a, b]) => time >= a && time <= b);
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

  // 教学刚结束即接上，不再留空档
  for (let t = 7.2; t < 20; t += 0.55) addEnemy(events, t, "walker");

  // 20–40 秒加密游走体
  for (let t = 20; t < 40; t += 0.4) addEnemy(events, t, "walker");

  // 40–70 秒：游走体与冲刺体成对涌来
  for (let t = 40; t < 70; t += 0.45) {
    addEnemy(events, t, "walker");
    addEnemy(events, t + 0.12, "sprinter");
  }

  // 70–收束：更密的成对波
  for (let t = 70; t <= 87; t += 0.36) {
    addEnemy(events, t, "walker");
    addEnemy(events, t + 0.1, "sprinter");
  }
  return events;
}

export const TIMELINE: TimelineEvent[] = [...GATE_EVENTS, ...buildHorde()].sort((a, b) => {
  if (a.time !== b.time) return a.time - b.time;
  if (a.kind === b.kind) return 0;
  return a.kind === "gate" ? -1 : 1;
});

/** 收束波最后一只的出现时间，用于判定「已放出收束波」 */
const enemyTimes = TIMELINE.filter((e) => e.kind === "enemy").map((e) => e.time);
export const FINAL_WAVE_LAST_SPAWN = Math.max(...enemyTimes);
