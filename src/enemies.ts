import { BASE_SPEED, DESPAWN_Z, ENEMY, LANE_X, MAX_ENEMIES, SPAWN_Z, TEAM_Z, type EnemyId } from "./config";
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
}

function resetE(e: Enemy): void {
  e.alive = false;
  e.hp = 0;
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
  }), resetE);

  clear(): void {
    this.pool.clear();
  }

  spawn(type: EnemyId, lane: "left" | "right"): Enemy | null {
    const e = this.pool.acquire();
    if (!e) return null;
    const def = ENEMY[type];
    e.alive = true;
    e.type = type;
    // 同一车道错开一点横向位置，连出时看起来是一群而不是单列重叠
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

  update(dt: number): void {
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

  hurt(e: Enemy, dmg: number): boolean {
    e.hp -= dmg;
    e.hitFlash = 0.08;
    if (e.hp <= 0) {
      e.alive = false;
      return true;
    }
    return false;
  }
}
