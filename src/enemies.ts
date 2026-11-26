import {
  BASE_SPEED,
  DESPAWN_Z,
  ENEMY,
  LANE_X,
  MAX_ENEMIES,
  SPAWN_Z,
  type EnemyId,
} from "./config";
import { Pool } from "./pool";

export interface Enemy {
  alive: boolean;
  type: EnemyId;
  x: number;
  y: number;
  z: number;
  hp: number;
  maxHp: number;
  radius: number;
  age: number;
  dashT: number;
  dashing: number;
  walk: number;
  hitFlash: number;
  airborne: boolean;
  jumpT: number;
  airT: number;
  isChild: boolean;
  driftX: number | null;
}

function resetE(e: Enemy): void {
  e.alive = false;
  e.hp = 0;
  e.airborne = false;
  e.isChild = false;
  e.y = 0;
  e.driftX = null;
}

export class Enemies {
  readonly pool = new Pool<Enemy>(MAX_ENEMIES, () => ({
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
    driftX: null,
  }), resetE);

  clear(): void {
    this.pool.clear();
  }

  spawn(
    type: EnemyId,
    lane: "left" | "right" | "mid",
    opts?: { x?: number; z?: number; hpMul?: number; isChild?: boolean; driftX?: number },
  ): Enemy | null {
    const e = this.pool.acquire();
    if (!e) return null;
    const def = ENEMY[type];
    const mul = Math.max(0.01, opts?.hpMul ?? 1);
    e.alive = true;
    e.type = type;
    // 同一车道错开一点横向位置，连出时看起来是一群而不是单列重叠
    const slot = this.pool.size % 3;
    const base = lane === "left" ? -LANE_X : lane === "mid" ? 0 : LANE_X;
    e.x = opts?.x ?? base + (slot - 1) * 0.62;
    e.y = 0;
    e.z = opts?.z ?? SPAWN_Z;
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
    e.jumpT = type === "jumper" ? 0.35 + (slot * 0.4) : 0;
    e.isChild = !!opts?.isChild;
    e.driftX = opts?.driftX ?? null;
    return e;
  }

  update(dt: number): void {
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
      e.z -= BASE_SPEED * def.speed * mul * dt;
      if (e.z < DESPAWN_Z || !e.alive) this.pool.releaseAt(i);
    }
  }

  private updateJumper(e: Enemy, dt: number): void {
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
  hurt(e: Enemy, dmg: number, opts?: { pierce?: boolean }): boolean {
    const takenMul = opts?.pierce
      ? 1
      : ("damageTakenMul" in ENEMY[e.type] ? (ENEMY[e.type] as { damageTakenMul?: number }).damageTakenMul ?? 1 : 1);
    e.hp -= dmg * takenMul;
    e.hitFlash = 0.08;
    if (e.hp <= 0) {
      e.alive = false;
      return true;
    }
    return false;
  }
}
