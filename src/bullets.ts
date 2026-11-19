import { BULLET_RANGE_Z, BULLET_SPEED, MAX_BULLETS, TEAM_Z } from "./config";
import { Pool } from "./pool";

export interface Bullet {
  alive: boolean;
  x: number;
  y: number;
  z: number;
  damage: number;
}

function resetB(b: Bullet): void {
  b.alive = false;
}

export class Bullets {
  readonly pool = new Pool<Bullet>(MAX_BULLETS, () => ({
    alive: false,
    x: 0,
    y: 0.8,
    z: TEAM_Z,
    damage: 1,
  }), resetB);

  clear(): void {
    this.pool.clear();
  }

  spawn(x: number, z: number, damage: number): Bullet | null {
    const b = this.pool.acquire();
    if (!b) return null;
    b.alive = true;
    b.x = x;
    b.y = 0.85;
    b.z = z + 0.8;
    b.damage = damage;
    return b;
  }

  update(dt: number): void {
    const list = this.pool.active;
    for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i];
      b.z += BULLET_SPEED * dt;
      if (b.z >= BULLET_RANGE_Z || !b.alive) this.pool.releaseAt(i);
    }
  }
}
