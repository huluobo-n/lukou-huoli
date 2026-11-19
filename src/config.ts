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
 */
export const TIMELINE: TimelineEvent[] = [
  // —— 0–10 秒教学 ——
  { time: 2.0, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 3.0, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 4.0, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 5.0, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 6.0, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 6.0, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
  { time: 7.25, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "冲锋枪" },

  // —— 10–40 秒：左道 +N / ×2 / 武器门，右道小股游走体 ——
  { time: 11.5, kind: "gate", lane: "left", gate: "add", value: 2, label: "+2" },
  { time: 12.0, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 13.1, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 14.2, kind: "enemy", lane: "right", enemy: "walker" },

  { time: 16.0, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "冲锋枪" },
  { time: 17.5, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 18.6, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 19.7, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 20.8, kind: "enemy", lane: "right", enemy: "walker" },

  { time: 22.0, kind: "gate", lane: "left", gate: "mul", value: 2, label: "×2" },

  { time: 24.0, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 25.2, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 26.4, kind: "enemy", lane: "right", enemy: "walker" },

  { time: 27.0, kind: "gate", lane: "left", gate: "add", value: 5, label: "+5" },
  { time: 30.0, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 31.2, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 32.4, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 33.6, kind: "enemy", lane: "right", enemy: "walker" },

  { time: 32.8, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },
  { time: 36.5, kind: "gate", lane: "left", gate: "add", value: 8, label: "+8" },
  { time: 36.8, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 38.0, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 39.2, kind: "enemy", lane: "right", enemy: "walker" },

  // —— 40–70 秒：混入冲刺体，约 40 秒后出现红门 -3 ——
  { time: 40.5, kind: "gate", lane: "right", gate: "red", value: 3, label: "-3" },
  { time: 40.5, kind: "gate", lane: "left", gate: "add", value: 3, label: "+3" },

  { time: 44.0, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 45.0, kind: "enemy", lane: "right", enemy: "sprinter" },
  { time: 46.1, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 47.0, kind: "enemy", lane: "right", enemy: "sprinter" },

  { time: 48.5, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "冲锋枪" },

  { time: 51.0, kind: "gate", lane: "left", gate: "add", value: 5, label: "+5" },
  { time: 52.0, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 53.0, kind: "enemy", lane: "right", enemy: "sprinter" },
  { time: 54.0, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 55.0, kind: "enemy", lane: "right", enemy: "sprinter" },

  { time: 58.0, kind: "gate", lane: "left", gate: "red", value: 3, label: "-3" },

  { time: 60.0, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 61.0, kind: "enemy", lane: "right", enemy: "sprinter" },
  { time: 62.0, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 63.2, kind: "enemy", lane: "right", enemy: "sprinter" },

  { time: 62.5, kind: "gate", lane: "left", gate: "add", value: 8, label: "+8" },
  { time: 67.0, kind: "gate", lane: "left", gate: "weapon", weapon: "smg", label: "冲锋枪" },

  { time: 66.0, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 67.0, kind: "enemy", lane: "right", enemy: "sprinter" },
  { time: 68.2, kind: "enemy", lane: "right", enemy: "walker" },

  // —— 70–90 秒：不再出加人门，收束波 ——
  { time: 72.0, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 72.9, kind: "enemy", lane: "right", enemy: "sprinter" },
  { time: 73.8, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 74.7, kind: "enemy", lane: "right", enemy: "sprinter" },
  { time: 75.6, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 76.5, kind: "enemy", lane: "right", enemy: "sprinter" },

  { time: 80.0, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 80.8, kind: "enemy", lane: "right", enemy: "sprinter" },
  { time: 81.6, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 82.4, kind: "enemy", lane: "right", enemy: "sprinter" },
  { time: 83.2, kind: "enemy", lane: "right", enemy: "walker" },
  { time: 84.0, kind: "enemy", lane: "right", enemy: "sprinter" },
];

/** 收束波最后一只的出现时间，用于判定「已放出收束波」 */
export const FINAL_WAVE_LAST_SPAWN = 84.0;
