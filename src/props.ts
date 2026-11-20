import {
  BARREL_HP,
  BASE_SPEED,
  CAGE_HP,
  DESPAWN_Z,
  MAX_PROPS,
  SPAWN_Z,
  laneCenterX,
  type PropKind,
  type PropLane,
} from "./config";
import { Pool } from "./pool";

export interface WorldProp {
  alive: boolean;
  kind: PropKind;
  lane: PropLane;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  radius: number;
  opened: boolean;
}

function resetP(p: WorldProp): void {
  p.alive = false;
  p.opened = false;
}

export class Props {
  readonly pool = new Pool<WorldProp>(MAX_PROPS, () => ({
    alive: false,
    kind: "barrel",
    lane: "right",
    x: 0,
    z: SPAWN_Z,
    hp: 3,
    maxHp: 3,
    radius: 0.9,
    opened: false,
  }), resetP);

  clear(): void {
    this.pool.clear();
  }

  spawn(kind: PropKind, lane: PropLane, opts?: { z?: number; hp?: number }): WorldProp | null {
    const p = this.pool.acquire();
    if (!p) return null;
    p.alive = true;
    p.kind = kind;
    p.lane = lane;
    p.x = laneCenterX(lane);
    p.z = opts?.z ?? SPAWN_Z;
    p.maxHp = opts?.hp ?? (kind === "cage" ? CAGE_HP : BARREL_HP);
    p.hp = p.maxHp;
    p.radius = kind === "cage" ? 1.15 : 0.95;
    p.opened = false;
    return p;
  }

  update(dt: number): void {
    const list = this.pool.active;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.z -= BASE_SPEED * dt;
      if (p.z < DESPAWN_Z || !p.alive) this.pool.releaseAt(i);
    }
  }

  hurt(p: WorldProp, dmg: number): boolean {
    p.hp -= dmg;
    if (p.hp <= 0) {
      p.hp = 0;
      p.opened = true;
      p.alive = false;
      return true;
    }
    return false;
  }
}
